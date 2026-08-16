import { Book, HelpCircle, Home, PlusCircle, Send, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FirstRunTour from './components/FirstRunTour';
import GeometricBackdrop from './components/GeometricBackdrop';
import HelpModal from './components/HelpModal';
import HistoryPanel from './components/HistoryPanel';
import { ErrorMessage, LoadingIndicator, MessageRenderer, ToolActivity } from './components/Messages';
import NextQuestCard from './components/NextQuestCard';
import Onboarding from './components/Onboarding';
import QuestTracker from './components/QuestTracker';
import QuickReplies from './components/QuickReplies';
import Toolbelt from './components/Toolbelt';
import CertificateCard from './components/CertificateCard';
import { callAI } from './aiClient';
import {
  createChatPayload,
  createStageScorePayload,
  createToolPayload,
  createWorkflowPayload,
  extractTextFromResponse,
  getFlowStageIndex,
  getFlowStages,
  getMessageParts,
  getThreadTitlePreview,
  parsePersonasJson,
  safeJsonParse,
} from './chatRuntime';
import { parseUploadedFile } from './fileUtils';
import { clearRoute, readRoute, setChatRoute } from './router';

const THREAD_MAP_KEY = 'guru_user_threads';
const USERNAME_KEY = 'guru_username';
const LAST_THREAD_KEY = (user) => `guru_last_thread_${user}`;
const TOUR_KEY = 'guru_seen_tour';

const INITIAL_MESSAGES = {
  start_project:
    "Aight, a new idea. Every great project starts with a spark. What's the general problem area you're thinking about? No need for a perfect pitch, just the raw concept.",
  process_review:
    'Right, process critique. Before we tear into the output, walk me through what you actually did — research, decisions, dead ends. Upload docs whenever they help.',
  final_review:
    'Final roast time. Show me the finished piece and the framing that got you here — problem statement, solution, any images or docs. I will be direct.',
};

const TITLES = {
  start_project: 'Build a Problem Statement',
  process_review: 'Design Process Critique',
  final_review: 'Final Roast',
};

function loadThreadMap() {
  try {
    const saved = localStorage.getItem(THREAD_MAP_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function loadUsername() {
  try {
    return localStorage.getItem(USERNAME_KEY) || '';
  } catch {
    return '';
  }
}

function loadUserThreads(username) {
  const map = loadThreadMap();
  const userThreads = map[username];
  return Array.isArray(userThreads) ? userThreads : [];
}

function saveThreadMap(map) {
  try {
    localStorage.setItem(THREAD_MAP_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

function saveUserThreads(username, userThreads) {
  const map = loadThreadMap();
  map[username] = userThreads;
  return saveThreadMap(map);
}

function setLastActiveThread(username, threadId) {
  try {
    localStorage.setItem(LAST_THREAD_KEY(username), String(threadId));
  } catch {
    // ignore
  }
}

export default function App() {
  const [appState, setAppState] = useState('onboarding');
  const [username, setUsername] = useState('');
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [selectedProjectContext, setSelectedProjectContext] = useState(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isEmbed, setIsEmbed] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isWorkflowing, setIsWorkflowing] = useState(false);
  const embedShellRef = useRef(null);
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [revisingFromMessage, setRevisingFromMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ state: 'idle', at: null });
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const handledMessageIdsRef = useRef(new Set());
  const inFlightRef = useRef(false);
  const lastMessageCountRef = useRef(0);

  const currentThread = useMemo(
    () => threads.find((thread) => thread.id === currentThreadId),
    [threads, currentThreadId]
  );

  const currentStage = useMemo(
    () => (currentThread ? getFlowStageIndex(currentThread.flow, currentThread.messages) : -1),
    [currentThread]
  );

  const hasWorkflowCard = useMemo(
    () => currentThread?.messages?.some((message) => message.type === 'workflow_card') ?? false,
    [currentThread]
  );

  const nextQuest = useMemo(() => {
    if (!currentThread) return null;
    const stages = getFlowStages(currentThread.flow);
    const questClear = currentStage >= stages.length - 1;

    const hasGuruReply = currentThread.messages.some(
      (message) => message.type === 'guru' && message.text !== 'Thinking...'
    );

    if (currentThread.flow === 'start_project' && hasWorkflowCard) {
      return {
        title: 'Quest clear',
        body: 'Problem, solution, and workflow are on the table. Now stress-test the process or roast the final output.',
        actions: [
          { label: 'Process Critique', flow: 'process_review' },
          { label: 'Final Roast', flow: 'final_review' },
        ],
      };
    }

    if (currentThread.flow === 'process_review' && questClear) {
      return {
        title: 'Next quest unlocked',
        body: 'Process traced. Ready to put the final output on the table?',
        actions: [{ label: 'Final Roast', flow: 'final_review' }],
      };
    }

    if (currentThread.flow === 'process_review' && hasGuruReply) {
      return {
        title: 'Keep tracing',
        body: 'You can keep interrogating the process, or move on to the final roast.',
        actions: [{ label: 'Final Roast', flow: 'final_review' }],
      };
    }

    if (currentThread.flow === 'final_review' && questClear) {
      return {
        title: 'Run it back',
        body: 'Roast done. Take the notes, fix the work, start a new quest when ready.',
        actions: [{ label: 'Build a Problem Statement', flow: 'start_project' }],
      };
    }

    if (currentThread.flow === 'final_review' && hasGuruReply) {
      return {
        title: 'Keep roasting',
        body: 'Keep digging into the final output, or start a new framing session.',
        actions: [{ label: 'Build a Problem Statement', flow: 'start_project' }],
      };
    }

    return null;
  }, [currentThread, currentStage, hasWorkflowCard]);

  // Initial load: username, threads, route.
  useEffect(() => {
    try {
      const isEmbedMode = new URLSearchParams(window.location.search).get('embed') === '1';
      setIsEmbed(isEmbedMode);
      if (isEmbedMode) {
        document.body.classList.add('embed-mode');
      }
    } catch {
      // ignore
    }

    const storedUsername = loadUsername();
    const userThreads = storedUsername ? loadUserThreads(storedUsername) : [];
    setUsername(storedUsername);
    setThreads(userThreads);

    try {
      if (storedUsername && userThreads.length > 0) {
        const route = readRoute();
        let targetId = null;
        if (route.route === 'chat' && route.threadId) {
          const match = userThreads.find((thread) => thread.id === route.threadId);
          if (match) targetId = match.id;
        }
        if (!targetId) {
          const lastId = localStorage.getItem(LAST_THREAD_KEY(storedUsername));
          const match = userThreads.find((thread) => thread.id === Number(lastId));
          targetId = match ? match.id : userThreads[0].id;
        }
        setCurrentThreadId(targetId);
        setAppState('chat');
      } else {
        setAppState('onboarding');
      }
    } catch (loadError) {
      console.error('Failed to restore session', loadError);
      setAppState('onboarding');
    }

    return () => {
      document.body.classList.remove('embed-mode');
    };
  }, []);

  // Tour gate.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (isEmbed) return;
      const hasSeenTour = localStorage.getItem(TOUR_KEY) === '1';
      if (!hasSeenTour) {
        setIsTourOpen(true);
      }
    } catch {
      // ignore
    }
  }, [isEmbed]);

  // Sync route and last-active thread (disabled in embed mode).
  useEffect(() => {
    if (typeof window === 'undefined' || isEmbed) return;
    if (appState === 'chat' && currentThreadId) {
      setChatRoute(currentThreadId);
      if (username) setLastActiveThread(username, currentThreadId);
    } else if (appState === 'onboarding') {
      clearRoute();
    }
  }, [appState, currentThreadId, username, isEmbed]);

  // Persist threads per user.
  useEffect(() => {
    if (!username) return;
    const ok = saveUserThreads(username, threads);
    if (ok) {
      setSaveStatus({ state: 'saved', at: new Date() });
      return;
    }
    try {
      const pruned = threads.slice(0, 5);
      saveUserThreads(username, pruned);
      setSaveStatus({ state: 'saved', at: new Date() });
      setError('Local storage is full. Only your 5 most recent threads will persist after reload.');
    } catch {
      setSaveStatus({ state: 'error', at: new Date() });
      setError('Local storage is full. Thread history will not be saved on this device.');
    }
  }, [threads, username]);

  // Embed resize messaging.
  useEffect(() => {
    if (!isEmbed) return;
    if (typeof window === 'undefined') return;

    const target = document.body;
    const postSize = () => {
      const height = Math.ceil(document.documentElement.scrollHeight || target.scrollHeight || 0);
      window.parent?.postMessage({ type: 'not-a-guru:resize', height }, '*');
    };

    postSize();

    const observer = new ResizeObserver(() => postSize());
    observer.observe(target);

    const intervalId = window.setInterval(postSize, 1000);

    return () => {
      observer.disconnect();
      window.clearInterval(intervalId);
    };
  }, [isEmbed]);

  // Scroll to latest message.
  useEffect(() => {
    const currentCount = currentThread?.messages?.length || 0;
    if (currentCount > lastMessageCountRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
    lastMessageCountRef.current = currentCount;
  }, [currentThreadId, currentThread?.messages?.length]);

  // Fetch guru reply after user message.
  useEffect(() => {
    if (!currentThread || isLoading || inFlightRef.current) return;

    const lastMessage = currentThread.messages[currentThread.messages.length - 1];
    if (lastMessage?.type !== 'user') return;
    if (handledMessageIdsRef.current.has(lastMessage.id)) return;

    const fetchGuruResponse = async () => {
      const activeThreadId = currentThread.id;
      const userParts = getMessageParts(lastMessage);

      if (userParts.length === 0) {
        return;
      }

      handledMessageIdsRef.current.add(lastMessage.id);
      inFlightRef.current = true;
      setIsLoading(true);
      setError(null);

      const guruMessageId = Date.now();
      const placeholderMessage = {
        id: guruMessageId,
        type: 'guru',
        text: 'Thinking...',
        timestamp: new Date().toISOString(),
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
        const response = await callAI(payload);
        const result = await response.json();
        const finalText = extractTextFromResponse(result);

        if (!finalText) {
          throw new Error('The model returned no readable text.');
        }

        setThreads((prevThreads) =>
          prevThreads.map((thread) => {
            if (thread.id !== activeThreadId) return thread;
            const newMessages = [...thread.messages];
            const targetIndex = newMessages.findIndex((message) => message.id === guruMessageId);
            if (targetIndex !== -1) {
              newMessages[targetIndex] = {
                ...newMessages[targetIndex],
                text: finalText,
              };
            }
            return { ...thread, messages: newMessages };
          })
        );
      } catch (requestError) {
        console.error('Error fetching response:', requestError);
        setError(requestError.message);
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
      } finally {
        setIsLoading(false);
        inFlightRef.current = false;
      }
    };

    fetchGuruResponse();
  }, [currentThread, isLoading]);

  // Stage markers: append a stage-clear divider when the user advances a stage.
  useEffect(() => {
    if (currentStage < 0 || currentStage === 0 || !currentThread) return;

    const alreadyMarked = currentThread.messages.some(
      (message) => message.type === 'stage_marker' && message.stageIndex === currentStage
    );
    if (alreadyMarked) return;

    const stages = getFlowStages(currentThread.flow);
    const markerMessage = {
      id: `marker_${Date.now()}`,
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
  }, [currentStage, currentThread]);

  // Structured scoring pass: runs once after each stage marker is in place.
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

      const messagesBeforeMarker = currentThread.messages.slice(
        0,
        currentThread.messages.findIndex(
          (message) => message.type === 'stage_marker' && message.stageIndex === currentStage
        )
      );
      const targetMessage = [...messagesBeforeMarker]
        .reverse()
        .find((message) => message.type === 'user' && typeof message.text === 'string' && message.text.trim());

      const scoreText = targetMessage ? targetMessage.text.trim() : '';

      try {
        const payload = createStageScorePayload(currentThread, stageLabel, scoreText || threadSummaryText(currentThread.messages));
        const response = await callAI(payload);
        const result = await response.json();
        const content = extractTextFromResponse(result);

        if (!content) {
          throw new Error('The model returned no score.');
        }

        const parsed = safeJsonParse(content, 'score');
        const scoreMessage = {
          id: `score_${Date.now()}`,
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
        setError(`Stage scoring failed: ${scoreError.message}`);
      } finally {
        setIsScoring(false);
      }
    };

    runScore();
  }, [currentThread, currentStage, isLoading, isScoring, isWorkflowing]);

  function threadSummaryText(messages) {
    return messages
      .filter((message) => (message.type === 'user' || message.type === 'guru') && typeof message.text === 'string')
      .map((message) => message.text)
      .join('\n\n');
  }

  // Workflow proposal: runs once after the final stage marker for start_project.
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
        const result = await response.json();
        const content = extractTextFromResponse(result);

        if (!content) {
          throw new Error('The model returned no workflow.');
        }

        const parsed = safeJsonParse(content, 'workflow');
        const workflowMessage = {
          id: `workflow_${Date.now()}`,
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
        setError(`Workflow proposal failed: ${workflowError.message}`);
      } finally {
        setIsWorkflowing(false);
      }
    };

    runWorkflow();
  }, [currentThread, currentStage, isLoading, isScoring, isWorkflowing]);

  function handleSetUsername(newUsername) {
    const trimmed = newUsername.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      localStorage.setItem(USERNAME_KEY, trimmed);
    } catch {
      // ignore
    }
    setUsername(trimmed);

    const userThreads = loadUserThreads(trimmed);
    setThreads(userThreads);

    if (userThreads.length > 0) {
      const lastId = localStorage.getItem(LAST_THREAD_KEY(trimmed));
      const match = userThreads.find((thread) => thread.id === Number(lastId));
      setCurrentThreadId(match ? match.id : userThreads[0].id);
      setAppState('chat');
    } else {
      setAppState('onboarding');
    }

    setIsLoading(false);
  }

  function handleContinueSession() {
    if (!currentThreadId && threads.length > 0) {
      setCurrentThreadId(threads[0].id);
    }
    setAppState('chat');
  }

  function resetToOnboarding() {
    setAppState('onboarding');
    setCurrentThreadId(null);
    setSelectedProjectContext(null);
    setInput('');
    setUploadedFile(null);
    setError(null);
    setIsScoring(false);
    setIsWorkflowing(false);
  }

  function handleNewSessionFromOnboarding() {
    setAppState('onboarding');
    setCurrentThreadId(null);
    setInput('');
    setUploadedFile(null);
    setError(null);
  }

  function handleOnboardingSelect(selectedFlow) {
    setIsLoading(true);
    handleContextSelect('default', selectedFlow);
  }

  function handleContextSelect(projectContext, explicitFlow) {
    setIsLoading(true);
    setSelectedProjectContext(projectContext);

    const newThread = {
      id: Date.now(),
      username,
      title: TITLES[explicitFlow],
      flow: explicitFlow,
      projectContext,
      messages: [
        {
          id: `initial_guru_${Date.now()}`,
          type: 'guru',
          text: INITIAL_MESSAGES[explicitFlow],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setThreads((prev) => [newThread, ...prev]);
    setCurrentThreadId(newThread.id);
    setAppState('chat');
    setIsLoading(false);
  }

  const handleSendMessage = useCallback((overrideText) => {
    const messageText = (typeof overrideText === 'string' ? overrideText : input).trim();
    const attachments = uploadedFile ? [uploadedFile] : [];

    if (!messageText && attachments.length === 0) {
      setError('Add a message or a file so the review has something to work with.');
      return;
    }

    setError(null);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: messageText,
      attachments,
      timestamp: new Date().toISOString(),
    };

    setThreads((prevThreads) => {
      const newThreads = [...prevThreads];
      const threadIndex = newThreads.findIndex((thread) => thread.id === currentThreadId);
      if (threadIndex === -1) return prevThreads;

      const updatedThread = { ...newThreads[threadIndex] };
      updatedThread.messages = [...updatedThread.messages, userMessage];

      if (updatedThread.messages.filter((message) => message.type === 'user').length === 1) {
        updatedThread.title = getThreadTitlePreview(messageText, attachments);
      }

      newThreads[threadIndex] = updatedThread;
      return newThreads;
    });

    setInput('');
    setUploadedFile(null);
    setRevisingFromMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [currentThreadId, input, uploadedFile]);

  function handleQuickReply(text) {
    if (isLoading || isParsing || isScoring || isWorkflowing || !currentThread) return;
    handleSendMessage(text);
  }

  function handleReviseFrom(message) {
    if (isLoading || isParsing || isScoring || isWorkflowing || !currentThread) return;
    if (!message || typeof message.text !== 'string') return;
    setRevisingFromMessage(message);
    setInput(message.text);
  }

  function cancelRevision() {
    setRevisingFromMessage(null);
    setInput('');
  }

  const toolPhase = useMemo(() => {
    if (isWorkflowing) return 'Building workflow…';
    if (isScoring && currentThread) {
      const stages = getFlowStages(currentThread.flow);
      const label = stages[currentStage] || 'stage';
      return `Scoring ${label}…`;
    }
    if (isLoading) return 'Reading conversation…';
    return null;
  }, [isWorkflowing, isScoring, isLoading, currentThread, currentStage]);

  function handleNextQuest(flow) {
    if (isLoading || isScoring || isWorkflowing) return;
    handleContextSelect('default', flow);
  }

  function handleRepeatProblemBuilder() {
    if (!currentThread || currentThread.flow !== 'start_project') return;

    handledMessageIdsRef.current.clear();
    setInput('');
    setUploadedFile(null);
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
                  id: `initial_guru_${Date.now()}`,
                  type: 'guru',
                  text: INITIAL_MESSAGES.start_project,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : thread
      )
    );
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const parsedFile = await parseUploadedFile(file);
      setUploadedFile(parsedFile);
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      setError(parseError.message);
    } finally {
      setIsParsing(false);
    }
  }

  function clearUploadedFile() {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleToolUse(toolType) {
    if (!currentThread) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = createToolPayload(toolType, currentThread);
      const response = await callAI(payload);
      const result = await response.json();
      const content = extractTextFromResponse(result);

      if (!content) {
        throw new Error('Received an empty or invalid response from OpenAI.');
      }

      let newToolMessage;
      if (toolType === 'personas') {
        let personas;
        try {
          personas = parsePersonasJson(content);
        } catch {
          throw new Error('The personas response was not valid JSON. Try the tool again.');
        }
        newToolMessage = { id: Date.now(), type: 'tool_personas', personas, timestamp: new Date().toISOString() };
      } else {
        newToolMessage = { id: Date.now(), type: 'tool_critique', text: content, timestamp: new Date().toISOString() };
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
      setError(`The specialist tool hit a snag: ${toolError.message}.`);
    } finally {
      setIsLoading(false);
    }
  }

  function selectThread(threadId) {
    setCurrentThreadId(threadId);
    setIsHistoryPanelOpen(false);
    setAppState('chat');
  }

  const lastThreadTitle = useMemo(() => {
    const lastId = localStorage.getItem(LAST_THREAD_KEY(username));
    const match = threads.find((thread) => thread.id === Number(lastId));
    return match ? match.title : threads[0]?.title || null;
  }, [threads, username]);

  const [tickNow, setTickNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setTickNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const saveStatusLabel = useMemo(() => {
    if (saveStatus.state === 'error') return 'Could not save';
    if (saveStatus.state === 'idle' || !saveStatus.at) return null;
    const ageMs = tickNow - saveStatus.at.getTime();
    if (ageMs < 30 * 1000) return 'Saved · just now';
    try {
      return `Saved · ${saveStatus.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Saved';
    }
  }, [saveStatus, tickNow]);

  if (appState === 'onboarding') {
    return (
      <>
        <Onboarding
          username={username}
          lastThreadTitle={lastThreadTitle}
          onSetUsername={handleSetUsername}
          onContinueSession={handleContinueSession}
          onSelect={handleOnboardingSelect}
          onOpenHelp={() => setIsHelpOpen(true)}
          isLoading={isLoading}
        />
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        <GeometricBackdrop />
        <FirstRunTour
          isOpen={isTourOpen}
          onClose={() => {
            setIsTourOpen(false);
            try {
              localStorage.setItem(TOUR_KEY, '1');
            } catch {
              // ignore
            }
          }}
        />
      </>
    );
  }

  return (
    <div
      ref={embedShellRef}
      className={`view-enter bg-[#090909] text-white flex h-screen antialiased overflow-hidden ${isEmbed ? 'embed-shell' : ''}`}
    >
      <GeometricBackdrop />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      {!isEmbed && (
        <HistoryPanel
          threads={threads}
          currentThreadId={currentThreadId}
          onSelectThread={selectThread}
          onNewChat={resetToOnboarding}
          isOpen={isHistoryPanelOpen}
          setIsOpen={setIsHistoryPanelOpen}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <a href="#main-work-surface" className="skip-link">Skip to chat</a>
        {/* Product bar */}
        <header className="border-b border-[#6B6965] bg-[#090909] px-4 py-3 flex items-center justify-between shrink-0 z-10">
          {isEmbed ? (
            <button
              onClick={resetToOnboarding}
              className="p-2 text-[#C8C5BF] hover:text-white transition-colors"
              aria-label="New chat"
              title="New chat"
            >
              <PlusCircle size={20} />
            </button>
          ) : (
            <button
              onClick={() => setIsHistoryPanelOpen(true)}
              className="p-2 text-[#C8C5BF] hover:text-white transition-colors lg:hidden"
              aria-label="Open history"
            >
              <Book size={20} />
            </button>
          )}

          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <img src="/brand/dotai-logo-mark.png" alt="dotai" className="h-6 w-auto opacity-90" />
              <h1 className="text-lg sm:text-xl font-semibold tracking-widest text-white uppercase font-mono">
                {currentThread?.title || 'Not a Guru'}
              </h1>
            </div>
            {saveStatusLabel && (
              <span
                aria-live="polite"
                className={`text-[10px] uppercase font-mono tracking-[0.18em] ${
                  saveStatus.state === 'error' ? 'text-[#B42318]' : 'text-[#6B6965]'
                }`}
              >
                {saveStatusLabel}
              </span>
            )}
          </div>

          {isEmbed ? (
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-[#C8C5BF] hover:text-white transition-colors"
              aria-label="Open help"
            >
              <HelpCircle size={20} />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={resetToOnboarding}
                className="p-2 text-[#C8C5BF] hover:text-white transition-colors"
                aria-label="Back to home"
                title="Back to home"
              >
                <Home size={20} />
              </button>
              <button
                onClick={() => setIsHelpOpen(true)}
                className="p-2 text-[#C8C5BF] hover:text-white transition-colors"
                aria-label="Open help"
              >
                <HelpCircle size={20} />
              </button>
              <button
                onClick={() => setIsHistoryPanelOpen((prev) => !prev)}
                className="p-2 text-[#C8C5BF] hover:text-white transition-colors hidden lg:block"
                aria-label="Toggle history"
              >
                <Book size={20} />
              </button>
            </div>
          )}
        </header>

        {/* Main workspace */}
        <main
          id="main-work-surface"
          aria-label="Conversation"
          className={`flex-1 overflow-y-auto ${isEmbed ? 'p-3' : 'p-4 md:p-6'}`}
        >
          <div
            className="max-w-3xl mx-auto space-y-6"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {currentStage >= 0 && currentThread && (
              <QuestTracker stage={currentStage} flow={currentThread.flow} />
            )}
            {currentThread?.messages.map((message, index) => (
              <MessageRenderer
                key={message.id}
                message={message}
                isLoading={isLoading}
                isLastMessage={index === currentThread.messages.length - 1}
                onRepeat={handleRepeatProblemBuilder}
                onReviseFrom={
                  message.type === 'user' && index !== currentThread.messages.length - 1
                    ? handleReviseFrom
                    : undefined
                }
              />
            ))}
            <ToolActivity phase={toolPhase} />
            {(isLoading || isScoring || isWorkflowing) &&
              (!currentThread || currentThread.messages.length === 0) && <LoadingIndicator />}
            <Toolbelt
              messages={currentThread?.messages || []}
              flow={currentThread?.flow}
              onToolUse={handleToolUse}
              isLoading={isLoading || isScoring || isWorkflowing}
            />
            <CertificateCard thread={currentThread} username={username} />
            {nextQuest && !isLoading && !isScoring && !isWorkflowing && (
              <NextQuestCard
                title={nextQuest.title}
                body={nextQuest.body}
                actions={nextQuest.actions}
                onSelect={handleNextQuest}
                isLoading={isLoading || isScoring || isWorkflowing}
              />
            )}
            <div ref={chatEndRef} />
          </div>
        </main>

        {/* Composer */}
        <footer className="border-t border-[#6B6965] bg-[#090909] px-4 py-3 shrink-0 z-10">
          <div className="max-w-3xl mx-auto">
            {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
            {uploadedFile && (
              <div className="mb-2 flex items-center justify-between gap-3 border border-[#6B6965] bg-[#090909] px-3 py-2 text-sm text-[#EFEDE8]">
                <span className="truncate font-mono text-xs">{uploadedFile.name}</span>
                <button
                  onClick={clearUploadedFile}
                  className="text-[#6B6965] hover:text-white transition-colors"
                  aria-label="Remove attachment"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {revisingFromMessage && (
              <div className="mb-2 flex items-center justify-between gap-3 border border-[#FF00A8] bg-[#4A002D]/30 px-3 py-2 text-xs font-mono uppercase tracking-[0.12em] text-[#FF00A8]">
                <span className="truncate">
                  Revising from{' '}
                  {new Date(revisingFromMessage.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  · send to branch
                </span>
                <button
                  onClick={cancelRevision}
                  className="text-[#FF00A8]/70 hover:text-white transition-colors"
                  aria-label="Cancel revision"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {(isScoring || isWorkflowing) && (
              <div className="mb-2 text-center text-xs uppercase font-mono tracking-widest text-[#FF00A8] animate-pulse">
                {isScoring ? 'Scoring stage…' : 'Building workflow…'}
              </div>
            )}
            <QuickReplies
              flow={currentThread?.flow}
              onPick={handleQuickReply}
              disabled={isLoading || isParsing || isScoring || isWorkflowing || !currentThread}
            />

            {/* Signature chatbox */}
            <div className="relative flex flex-col border border-[#F7F5F0] focus-within:border-[#FF00A8] focus-within:border-b-2 bg-[#090909] transition-colors">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a]">
                <span className="text-xs uppercase font-mono tracking-wider text-[#6B6965]">Composer</span>
                <div className="h-px flex-1 bg-[#2a2a2a]" />
              </div>
              <div className="flex items-center px-2 py-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,.docx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing || isLoading || isScoring || isWorkflowing}
                  className="p-2 text-[#6B6965] hover:text-white disabled:opacity-40 transition-colors"
                  aria-label="Attach file"
                >
                  <Upload size={18} />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={isParsing ? 'Reading your file…' : 'What are you trying to understand?'}
                  className="flex-1 bg-transparent px-3 py-2 text-base text-white placeholder-[#6B6965] focus:outline-none font-[var(--font-ui)]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || isParsing || isScoring || isWorkflowing}
                  className="relative overflow-hidden bg-[#FF00A8] text-black px-4 py-2 text-sm uppercase font-mono font-semibold tracking-wider clip-corner hover:brightness-110 disabled:opacity-40 transition-all"
                >
                  <Send size={16} className="relative z-10" />
                </button>
              </div>
            </div>

            <div className="mt-2 text-center text-[10px] uppercase text-[#6B6965] font-mono tracking-[0.2em]">
              powered by dotai
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
