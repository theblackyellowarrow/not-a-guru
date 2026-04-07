import { Book, Send, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FileStagingScreen from './components/FileStagingScreen';
import HistoryPanel from './components/HistoryPanel';
import { ErrorMessage, LoadingIndicator, MessageRenderer } from './components/Messages';
import Onboarding from './components/Onboarding';
import ProjectContextScreen from './components/ProjectContextScreen';
import Toolbelt from './components/ToolbeltClean';
import { parseUploadedFile } from './fileUtils';
import { callGeminiAPI } from './gemini';
import { getDynamicPersona } from './personaPrompt';

const STORAGE_KEY = 'guru_threads';

const INITIAL_MESSAGES = {
  start_project:
    "Aight, a new idea. Every great project starts with a spark. Let's get into it. What's the general problem area you're thinking about? No need for a perfect pitch, just the raw concept.",
  venting_mode:
    "Spill it. Bad crit? Annoying mentor? Or just want to know how this works? I'm listening.",
};

const TITLES = {
  start_project: 'Vibe Check a New Idea',
  venting_mode: 'Just Venting',
};

const PROCESS_REVIEW_FILES = [
  { key: 'problem_statement', label: 'Problem Statement', compulsory: true },
  { key: 'solution_statement', label: 'Solution Statement', compulsory: true },
  { key: 'stakeholder_map', label: 'Stakeholder Mapping' },
  { key: 'research_findings', label: 'Research Findings' },
  { key: 'primary_research', label: 'Primary Research Data' },
  { key: 'personas', label: 'Personas' },
  { key: 'empathy_map', label: 'Empathy Map' },
];

const FINAL_REVIEW_FILES = [
  { key: 'problem_statement', label: 'Problem Statement', compulsory: true },
  { key: 'solution_statement', label: 'Solution Statement', compulsory: true },
  { key: 'persona', label: 'Persona', compulsory: true },
  { key: 'ideations', label: 'Ideations (Image)', isImage: true, compulsory: true },
  { key: 'final_output', label: 'Final Output (Image)', isImage: true, compulsory: true },
];

const BLINDSPOT_PROMPT = `Based on the preceding conversation, surface potential blindspots. Never offer solutions. Just name what's missing. Let discomfort do the work.
Surface:
- Ethical contradictions
- Cultural erasures
- Material assumptions
- Ecological costs
- Long-term exclusions`;

function getThreadTitlePreview(messageText, attachments = []) {
  if (messageText) {
    return `${messageText.substring(0, 40)}${messageText.length > 40 ? '...' : ''}`;
  }

  if (attachments.length > 0) {
    return attachments[0].name;
  }

  return 'New Thread';
}

function buildAttachmentParts(attachment) {
  const attachmentLabel = attachment.label ? `${attachment.label} (${attachment.name})` : attachment.name;

  if (attachment.base64) {
    return [
      { text: `Attached file: ${attachmentLabel}. Critically analyse it in context.` },
      {
        inlineData: {
          mimeType: attachment.type,
          data: attachment.base64,
        },
      },
    ];
  }

  if (attachment.content) {
    return [
      {
        text: `Attached file: ${attachmentLabel}. The extracted text is:\n\n---\n\n${attachment.content.trim()}`,
      },
    ];
  }

  return [{ text: `Attached file: ${attachmentLabel}.` }];
}

function getMessageParts(message) {
  const parts = [];

  if (typeof message.text === 'string' && message.text.trim()) {
    parts.push({ text: message.text.trim() });
  }

  const attachments = message.attachments || (message.file ? [message.file] : []);
  attachments.forEach((attachment) => {
    parts.push(...buildAttachmentParts(attachment));
  });

  if (message.type === 'tool_personas' && Array.isArray(message.personas)) {
    parts.push({
      text: `Draft personas JSON:\n${JSON.stringify(message.personas, null, 2)}`,
    });
  }

  return parts;
}

function buildContextHistory(messages) {
  return messages
    .map((message) => {
      const parts = getMessageParts(message);
      if (parts.length === 0) return null;

      return {
        role: message.type === 'user' ? 'user' : 'model',
        parts,
      };
    })
    .filter(Boolean);
}

function parseStreamChunk(part) {
  const jsonString = part.replace(/^data:\s*/, '').trim();
  if (!jsonString || jsonString === '[DONE]') {
    return null;
  }

  return JSON.parse(jsonString);
}

function getReviewPrompt(flow, stagedFiles) {
  const intro = `Right, you've submitted files for a ${flow.replace('_', ' ')}. I'll be looking at these documents:`;
  const fileList = Object.entries(stagedFiles)
    .map(([, file]) => `- ${file.label}: ${file.name}`)
    .join('\n');

  if (flow === 'final_review') {
    return `${intro}\n${fileList}\n\nI've attached the material. Trace the alignment between the framing, the persona, the ideation, and the final output before you critique the finish.`;
  }

  return `${intro}\n${fileList}\n\nI've attached the material. Let's start by tracing the why. How did your research findings directly shape the problem statement you've defined?`;
}

export default function App() {
  const [appState, setAppState] = useState('onboarding');
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [tempFlow, setTempFlow] = useState(null);
  const [selectedProjectContext, setSelectedProjectContext] = useState(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const currentThread = useMemo(
    () => threads.find((thread) => thread.id === currentThreadId),
    [threads, currentThreadId]
  );

  useEffect(() => {
    try {
      const savedThreads = localStorage.getItem(STORAGE_KEY);
      if (!savedThreads) {
        setAppState('onboarding');
        return;
      }

      const parsedThreads = JSON.parse(savedThreads);
      if (!Array.isArray(parsedThreads) || parsedThreads.length === 0) {
        setAppState('onboarding');
        return;
      }

      setThreads(parsedThreads);
      setCurrentThreadId(parsedThreads[0].id);
      setAppState('chat');
    } catch (loadError) {
      console.error('Failed to load threads from localStorage', loadError);
      setAppState('onboarding');
    }
  }, []);

  useEffect(() => {
    try {
      if (threads.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch (saveError) {
      console.error('Failed to save threads to localStorage', saveError);
    }
  }, [threads]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads, currentThreadId]);

  useEffect(() => {
    if (!currentThread || isLoading) return;

    const lastMessage = currentThread.messages[currentThread.messages.length - 1];
    if (lastMessage?.type !== 'user') return;

    const streamGuruResponse = async () => {
      const activeThreadId = currentThread.id;
      const userParts = getMessageParts(lastMessage);

      if (userParts.length === 0) {
        return;
      }

      setIsLoading(true);
      setError(null);

      const guruMessageId = Date.now();
      const placeholderMessage = { id: guruMessageId, type: 'guru', text: '', timestamp: new Date().toISOString() };

      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === activeThreadId
            ? { ...thread, messages: [...thread.messages, placeholderMessage] }
            : thread
        )
      );

      try {
        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: getDynamicPersona(currentThread.flow, currentThread.projectContext) }],
            },
            {
              role: 'model',
              parts: [{ text: "Understood. I'll trace the why and stay with the tensions in the work." }],
            },
            ...buildContextHistory(currentThread.messages.slice(0, -1)),
            { role: 'user', parts: userParts },
          ],
        };

        const response = await callGeminiAPI(payload, { stream: true });
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Streaming is unavailable for this response.');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let receivedText = false;

        const processStreamLine = (line) => {
          if (!line.trim()) return;

          try {
            const json = parseStreamChunk(line);
            if (!json) return;
            if (json.error) {
              throw new Error(json.error.message);
            }
            const textChunk = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textChunk) return;

            receivedText = true;

            setThreads((prevThreads) =>
              prevThreads.map((thread) => {
                if (thread.id !== activeThreadId) return thread;
                const newMessages = [...thread.messages];
                const targetIndex = newMessages.findIndex((message) => message.id === guruMessageId);
                if (targetIndex !== -1) {
                  newMessages[targetIndex] = {
                    ...newMessages[targetIndex],
                    text: newMessages[targetIndex].text + textChunk,
                  };
                }
                return { ...thread, messages: newMessages };
              })
            );
          } catch (streamError) {
            console.warn('Could not parse stream part as JSON:', line, streamError);
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            buffer += decoder.decode();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          lines.forEach(processStreamLine);
        }

        buffer
          .split('\n')
          .filter(Boolean)
          .forEach(processStreamLine);

        if (!receivedText) {
          throw new Error(
            'The model returned no readable text. If this keeps happening, the Gemini API key may be out of quota.'
          );
        }
      } catch (requestError) {
        console.error('Error fetching streaming response:', requestError);
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
      }
    };

    streamGuruResponse();
  }, [currentThread, isLoading]);

  function resetToOnboarding() {
    setAppState('onboarding');
    setCurrentThreadId(null);
    setTempFlow(null);
    setSelectedProjectContext(null);
    setInput('');
    setUploadedFile(null);
    setError(null);
  }

  function handleOnboardingSelect(selectedFlow) {
    setIsLoading(true);
    setTempFlow(selectedFlow);

    if (selectedFlow === 'venting_mode') {
      handleContextSelect('n/a', selectedFlow);
      return;
    }

    setAppState('project_context');
    setIsLoading(false);
  }

  function handleContextSelect(projectContext, explicitFlow = tempFlow) {
    setIsLoading(true);
    setSelectedProjectContext(projectContext);

    if (explicitFlow === 'start_project' || explicitFlow === 'venting_mode') {
      const newThread = {
        id: Date.now(),
        title: TITLES[explicitFlow],
        flow: explicitFlow,
        projectContext,
        messages: [
          {
            id: 'initial_guru',
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
      return;
    }

    setAppState(`${explicitFlow}_upload`);

    setIsLoading(false);
  }

  const handleSendMessage = useCallback(() => {
    const messageText = input.trim();
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [currentThreadId, input, uploadedFile]);

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

    let payload;

    if (toolType === 'personas') {
      payload = {
        contents: [
          ...buildContextHistory(currentThread.messages),
          {
            role: 'user',
            parts: [
              {
                text: `Based on the preceding conversation, ask these questions about the user's personas:
- Are these personas constructed from lived realities or from marketing shorthand?
- Do they reflect linguistic, geographic, caste/class plurality?
- Do the frustrations reflect systemic barriers or just convenience issues?
Then, generate 3 distinct user persona skeletons based on the user's project. Provide the output as a valid JSON array. Each object in the array must follow this exact schema: { "name": "string", "demographic": "string (age, location, occupation)", "needs": ["string", "string"], "frustrations": ["string", "string"], "quote": "string" }.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                demographic: { type: 'STRING' },
                needs: { type: 'ARRAY', items: { type: 'STRING' } },
                frustrations: { type: 'ARRAY', items: { type: 'STRING' } },
                quote: { type: 'STRING' },
              },
              required: ['name', 'demographic', 'needs', 'frustrations', 'quote'],
            },
          },
        },
      };
    } else {
      payload = {
        contents: [
          ...buildContextHistory(currentThread.messages),
          {
            role: 'user',
            parts: [
              {
                text: `Based on the preceding conversation, surface potential blindspots. Never offer solutions. Just name what’s missing. Let discomfort do the work.
Surface:
- Ethical contradictions
- Cultural erasures
- Material assumptions
- Ecological costs
- Long-term exclusions`,
              },
            ],
          },
        ],
      };
    }

    if (toolType !== 'personas') {
      payload.contents[payload.contents.length - 1].parts[0].text = `Based on the preceding conversation, surface potential blindspots. Never offer solutions. Just name what's missing. Let discomfort do the work.
Surface:
- Ethical contradictions
- Cultural erasures
- Material assumptions
- Ecological costs
- Long-term exclusions`;
    }

    try {
      const response = await callGeminiAPI(payload);
      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('Received an empty or invalid response from Gemini.');
      }

      const newToolMessage =
        toolType === 'personas'
          ? { id: Date.now(), type: 'tool_personas', personas: JSON.parse(content), timestamp: new Date().toISOString() }
          : { id: Date.now(), type: 'tool_critique', text: content, timestamp: new Date().toISOString() };

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

  async function handleReviewSubmit(stagedFiles, flow) {
    setIsLoading(true);
    setError(null);

    const definitions = flow === 'final_review' ? FINAL_REVIEW_FILES : PROCESS_REVIEW_FILES;

    try {
      const parsedAttachments = await Promise.all(
        Object.entries(stagedFiles).map(async ([key, file]) => {
          const config = definitions.find((item) => item.key === key);
          const parsedFile = await parseUploadedFile(file);

          return {
            ...parsedFile,
            key,
            label: config?.label || key,
          };
        })
      );

      const attachmentLookup = Object.fromEntries(
        parsedAttachments.map((attachment) => [attachment.key, attachment])
      );

      const newThread = {
        id: Date.now(),
        title: `Review: ${new Date().toLocaleString()}`,
        flow,
        projectContext: selectedProjectContext,
        messages: [
          {
            id: 'initial_user',
            type: 'user',
            text: getReviewPrompt(flow, attachmentLookup),
            attachments: parsedAttachments,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      setThreads((prev) => [newThread, ...prev]);
      setCurrentThreadId(newThread.id);
      setAppState('chat');
    } catch (reviewError) {
      console.error('Failed to prepare review submission:', reviewError);
      setError(reviewError.message);
    } finally {
      setIsLoading(false);
    }
  }

  function selectThread(threadId) {
    setCurrentThreadId(threadId);
    setIsHistoryPanelOpen(false);
    setAppState('chat');
  }

  if (appState === 'onboarding') {
    return <Onboarding onSelect={handleOnboardingSelect} isLoading={isLoading} />;
  }

  if (appState === 'project_context') {
    return (
      <ProjectContextScreen
        onSelectContext={(context) => handleContextSelect(context, tempFlow)}
        onBack={resetToOnboarding}
      />
    );
  }

  if (appState === 'process_review_upload') {
    return (
      <FileStagingScreen
        title="Process Review"
        description="To get a solid process review, upload the two required docs plus at least three more. Show the working."
        requiredFiles={PROCESS_REVIEW_FILES}
        minOptional={3}
        onSubmit={(files) => handleReviewSubmit(files, 'process_review')}
        onBack={resetToOnboarding}
      />
    );
  }

  if (appState === 'final_review_upload') {
    return (
      <FileStagingScreen
        title="Roast My Final Design"
        description="For a proper final critique, upload all of the following."
        requiredFiles={FINAL_REVIEW_FILES}
        minOptional={0}
        onSubmit={(files) => handleReviewSubmit(files, 'final_review')}
        onBack={resetToOnboarding}
      />
    );
  }

  return (
    <div className="bg-black text-gray-200 font-sans flex h-screen antialiased overflow-hidden">
      <HistoryPanel
        threads={threads}
        currentThreadId={currentThreadId}
        onSelectThread={selectThread}
        onNewChat={resetToOnboarding}
        isOpen={isHistoryPanelOpen}
        setIsOpen={setIsHistoryPanelOpen}
      />

      <div className="flex-1 flex flex-col transition-all duration-300">
        <header className="border-b-2 border-gray-800 p-4 flex items-center justify-between text-center shrink-0">
          <button onClick={() => setIsHistoryPanelOpen(true)} className="p-2 text-gray-400 hover:text-white lg:hidden">
            <Book size={20} />
          </button>
          <h1 className="text-2xl font-bold tracking-wider text-gray-300 mx-auto uppercase font-mono">
            {currentThread?.title || 'Not a Guru'}
          </h1>
          <button
            onClick={() => setIsHistoryPanelOpen((prev) => !prev)}
            className="p-2 text-gray-400 hover:text-white hidden lg:block"
          >
            <Book size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {currentThread?.messages.map((message, index) => (
              <MessageRenderer
                key={message.id}
                message={message}
                isLoading={isLoading}
                isLastMessage={index === currentThread.messages.length - 1}
              />
            ))}
            {isLoading && (!currentThread || currentThread.messages.length === 0) && <LoadingIndicator />}
            <Toolbelt
              messages={currentThread?.messages || []}
              flow={currentThread?.flow}
              onToolUse={handleToolUse}
              isLoading={isLoading}
            />
            <div ref={chatEndRef} />
          </div>
        </main>

        <footer className="border-t-2 border-gray-800 p-4 bg-black/80 backdrop-blur-sm shrink-0">
          <div className="max-w-3xl mx-auto">
            {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
            {uploadedFile && (
              <div className="mb-3 flex items-center justify-between gap-3 border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300">
                <span className="truncate">Attached: {uploadedFile.name}</span>
                <button
                  onClick={clearUploadedFile}
                  className="text-gray-500 transition-colors hover:text-white"
                  aria-label="Remove attachment"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center bg-gray-900 p-2 border-2 border-gray-700 focus-within:border-fuchsia-500">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,.docx"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing || isLoading}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
              >
                <Upload size={20} />
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
                placeholder={isParsing ? 'Reading your file...' : "So, what's the move?"}
                className="flex-1 bg-transparent px-4 text-base text-gray-200 placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || isParsing}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
