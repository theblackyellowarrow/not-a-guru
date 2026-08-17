import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createChatPayload,
  createStageScorePayload,
  createToolPayload,
  createWorkflowPayload,
  generateId,
  generateThreadId,
  getFlowStageIndex,
  getFlowStages,
  getMessageParts,
  getThreadTitlePreview,
  parseAIResponse,
  parsePersonasJson,
  safeJsonParse,
} from '../chatRuntime';
import { streamAITokens, callAI } from '../aiClient';
import { TITLES, generateErrorRef } from '../storage';

function threadSummaryText(messages, { maxChars = 4000 } = {}) {
  const text = messages
    .filter((message) => (message.type === 'user' || message.type === 'guru') && typeof message.text === 'string')
    .map((message) => message.text)
    .join('\n\n');
  return text.length > maxChars ? text.slice(-maxChars) : text;
}

export default function useThreadRunner({
  username,
  currentThread,
  currentThreadId,
  currentStage,
  setThreads,
  setError,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isWorkflowing, setIsWorkflowing] = useState(false);
  const handledMessageIdsRef = useRef(new Set());
  const inFlightRef = useRef(false);

  // 1. Chat reply (streaming) after a user message.
  useEffect(() => {
    if (!currentThread || isLoading || inFlightRef.current) return;

    const lastMessage = currentThread.messages[currentThread.messages.length - 1];
    if (lastMessage?.type !== 'user') return;
    if (handledMessageIdsRef.current.has(lastMessage.id)) return;

    const fetchGuruResponse = async () => {
      const activeThreadId = currentThread.id;
      const userParts = getMessageParts(lastMessage);
      if (userParts.length === 0) return;

      handledMessageIdsRef.current.add(lastMessage.id);
      inFlightRef.current = true;
      setIsLoading(true);
      setError(null);

      const guruMessageId = generateId('guru');
      const placeholderMessage = {
        id: guruMessageId,
        type: 'guru',
        text: 'Drafting response…',
        phase: 'queued',
        timestamp: new Date().toISOString(),
      };

      const appendMessage = (patch) => {
        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.id === activeThreadId
              ? {
                  ...thread,
                  messages: thread.messages.map((message) =>
                    message.id === guruMessageId ? { ...message, ...patch } : message
                  ),
                }
              : thread
          )
        );
      };

      const removeMessage = () => {
        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.id === activeThreadId
              ? {
                  ...thread,
                  messages: thread.messages.filter((message) => message.id !== guruMessageId),
                }
              : thread
          )
        );
      };

      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === activeThreadId
            ? { ...thread, messages: [...thread.messages, placeholderMessage] }
            : thread
        )
      );

      try {
        const payload = createChatPayload(
          currentThread,
          currentThread.messages.slice(0, -1),
          userParts
        );

        let streamed = '';
        try {
          appendMessage({ phase: 'generating', text: '' });
          for await (const token of streamAITokens(payload, { label: 'reply' })) {
            streamed += token;
            appendMessage({ text: streamed });
          }
          appendMessage({ phase: 'ready' });
        } catch (streamError) {
          // Streaming not supported or failed — fall back to one-shot JSON.
          console.warn('Streaming reply failed, falling back to one-shot:', streamError.message);
          const response = await callAI(payload);
          const finalText = await parseAIResponse(response, { label: 'reply' });
          appendMessage({ text: finalText, phase: 'ready' });
        }
      } catch (requestError) {
        console.error('Error fetching response:', requestError);
        const refId = generateErrorRef();
        setError({ message: requestError.message, refId });
        removeMessage();
      } finally {
        setIsLoading(false);
        inFlightRef.current = false;
      }
    };

    fetchGuruResponse();
  }, [currentThread, isLoading, setError, setThreads]);

  // 2. Stage markers: insert a divider when the user advances a stage.
  useEffect(() => {
    if (currentStage < 0 || currentStage === 0 || !currentThread) return;

    const alreadyMarked = currentThread.messages.some(
      (message) => message.type === 'stage_marker' && message.stageIndex === currentStage
    );
    if (alreadyMarked) return;

    const stages = getFlowStages(currentThread.flow);
    const markerMessage = {
      id: generateId('marker'),
      type: 'stage_marker',
      stageIndex: currentStage,
      stageKey: `stage_${currentStage}`,
      text:
        currentStage === stages.length - 1
          ? `${stages[currentStage]} complete. Quest clear.`
          : `${stages[currentStage]} complete. Next: ${stages[currentStage + 1]}.`,
      timestamp: new Date().toISOString(),
    };

    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThread.id
          ? { ...thread, messages: [...thread.messages, markerMessage] }
          : thread
      )
    );
  }, [currentStage, currentThread, setThreads]);

  // 3. Stage scoring — runs once after the marker is in place.
  useEffect(() => {
    if (!currentThread || currentStage < 1 || isLoading || isScoring || isWorkflowing) return;

    const hasMarker = currentThread.messages.some(
      (message) => message.type === 'stage_marker' && message.stageIndex === currentStage
    );
    if (!hasMarker) return;

    const alreadyScored = currentThread.messages.some(
      (message) => message.type === 'score_card' && message.stageIndex === currentStage
    );
    if (alreadyScored) return;

    const stages = getFlowStages(currentThread.flow);
    const stageLabel = stages[currentStage];

    const runScore = async () => {
      const activeThreadId = currentThread.id;
      setIsScoring(true);
      setError(null);

      const markerIndex = currentThread.messages.findIndex(
        (message) => message.type === 'stage_marker' && message.stageIndex === currentStage
      );
      const messagesBeforeMarker = currentThread.messages.slice(0, markerIndex);
      const targetMessage = [...messagesBeforeMarker]
        .reverse()
        .find((message) => message.type === 'user' && typeof message.text === 'string' && message.text.trim());
      const scoreText = targetMessage ? targetMessage.text.trim() : '';

      try {
        const payload = createStageScorePayload(
          currentThread,
          stageLabel,
          scoreText || threadSummaryText(currentThread.messages)
        );
        const response = await callAI(payload);
        const content = await parseAIResponse(response, { label: 'score' });
        const parsed = safeJsonParse(content, 'score');
        const scoreMessage = {
          id: generateId('score'),
          type: 'score_card',
          stageIndex: currentStage,
          stageLabel,
          score: parsed.score,
          rationale: parsed.rationale,
          strengths: parsed.strengths,
          weaknesses: parsed.weaknesses,
          suggestedImprovement: parsed.suggestedImprovement,
          timestamp: new Date().toISOString(),
        };

        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.id === activeThreadId
              ? { ...thread, messages: [...thread.messages, scoreMessage] }
              : thread
          )
        );
      } catch (scoreError) {
        console.error('Error scoring stage:', scoreError);
        setError({ message: `Stage scoring failed: ${scoreError.message}`, refId: generateErrorRef() });
      } finally {
        setIsScoring(false);
      }
    };

    runScore();
  }, [currentThread, currentStage, isLoading, isScoring, isWorkflowing, setError, setThreads]);

  // 4. Workflow proposal for start_project after final stage marker.
  useEffect(() => {
    if (!currentThread || currentThread.flow !== 'start_project') return;
    const stages = getFlowStages(currentThread.flow);
    const finalStageIndex = stages.length - 1;
    if (currentStage !== finalStageIndex) return;
    if (isLoading || isScoring || isWorkflowing) return;

    const hasMarker = currentThread.messages.some(
      (message) => message.type === 'stage_marker' && message.stageIndex === currentStage
    );
    if (!hasMarker) return;

    const alreadyProposed = currentThread.messages.some((message) => message.type === 'workflow_card');
    if (alreadyProposed) return;

    const runWorkflow = async () => {
      const activeThreadId = currentThread.id;
      setIsWorkflowing(true);
      setError(null);

      try {
        const payload = createWorkflowPayload(currentThread);
        const response = await callAI(payload);
        const content = await parseAIResponse(response, { label: 'workflow' });
        const parsed = safeJsonParse(content, 'workflow');
        const workflowMessage = {
          id: generateId('workflow'),
          type: 'workflow_card',
          workflow: parsed.workflow,
          nextMilestone: parsed.nextMilestone,
          risks: parsed.risks,
          openQuestions: parsed.openQuestions,
          timestamp: new Date().toISOString(),
        };

        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.id === activeThreadId
              ? { ...thread, messages: [...thread.messages, workflowMessage] }
              : thread
          )
        );
      } catch (workflowError) {
        console.error('Error creating workflow:', workflowError);
        setError({ message: `Workflow proposal failed: ${workflowError.message}`, refId: generateErrorRef() });
      } finally {
        setIsWorkflowing(false);
      }
    };

    runWorkflow();
  }, [currentThread, currentStage, isLoading, isScoring, isWorkflowing, setError, setThreads]);

  const startThread = useCallback(
    (projectContext, explicitFlow) => {
      const newThread = {
        id: generateThreadId(),
        username,
        title: TITLES[explicitFlow],
        flow: explicitFlow,
        projectContext,
        messages: [
          {
            id: generateId('initial_guru'),
            type: 'guru',
            text: '',
            timestamp: new Date().toISOString(),
          },
        ],
      };
      setThreads((prev) => [newThread, ...prev]);
      return newThread;
    },
    [username, setThreads]
  );

  const sendUserMessage = useCallback(
    ({ text, attachments, currentThreadId: threadId, input }) => {
      const messageText = (typeof text === 'string' ? text : input || '').trim();
      const atts = attachments || [];
      if (!messageText && atts.length === 0) {
        setError({ message: 'Add a message or a file so the review has something to work with.', refId: null });
        return null;
      }

      setError(null);
      const userMessage = {
        id: generateId('user'),
        type: 'user',
        text: messageText,
        attachments: atts,
        timestamp: new Date().toISOString(),
      };

      setThreads((prevThreads) => {
        const newThreads = [...prevThreads];
        const threadIndex = newThreads.findIndex((thread) => thread.id === threadId);
        if (threadIndex === -1) return prevThreads;

        const updatedThread = { ...newThreads[threadIndex] };
        updatedThread.messages = [...updatedThread.messages, userMessage];

        if (updatedThread.messages.filter((message) => message.type === 'user').length === 1) {
          updatedThread.title = getThreadTitlePreview(messageText, atts);
        }

        newThreads[threadIndex] = updatedThread;
        return newThreads;
      });

      return userMessage;
    },
    [setError, setThreads]
  );

  const repeatProblemBuilder = useCallback(() => {
    handledMessageIdsRef.current.clear();
    setError(null);
    setIsScoring(false);
    setIsWorkflowing(false);
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              title: TITLES.start_project,
              messages: [
                {
                  id: generateId('initial_guru'),
                  type: 'guru',
                  text: '',
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : thread
      )
    );
  }, [currentThreadId, setError, setThreads]);

  const useTool = useCallback(
    async (toolType) => {
      if (!currentThread) return;
      setIsLoading(true);
      setError(null);
      try {
        const payload = createToolPayload(toolType, currentThread);
        const response = await callAI(payload);
        const content = await parseAIResponse(response, { label: 'tool' });

        let newToolMessage;
        if (toolType === 'personas') {
          let personas;
          try {
            personas = parsePersonasJson(content);
          } catch {
            throw new Error('The personas response was not valid JSON. Try the tool again.');
          }
          newToolMessage = { id: generateId('tool_personas'), type: 'tool_personas', personas, timestamp: new Date().toISOString() };
        } else {
          newToolMessage = { id: generateId('tool_critique'), type: 'tool_critique', text: content, timestamp: new Date().toISOString() };
        }

        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.id === currentThreadId
              ? { ...thread, messages: [...thread.messages, newToolMessage] }
              : thread
          )
        );
      } catch (toolError) {
        console.error(`Error using tool ${toolType}:`, toolError);
        setError({ message: `The specialist tool hit a snag: ${toolError.message}.`, refId: generateErrorRef() });
      } finally {
        setIsLoading(false);
      }
    },
    [currentThread, currentThreadId, setError, setThreads]
  );

  const isBusy = isLoading || isScoring || isWorkflowing;

  return {
    isLoading,
    isScoring,
    isWorkflowing,
    isBusy,
    startThread,
    sendUserMessage,
    repeatProblemBuilder,
    useTool,
  };
}

export { threadSummaryText };
export { getFlowStageIndex };
