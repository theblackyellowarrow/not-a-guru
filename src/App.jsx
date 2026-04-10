import { Book, HelpCircle, Send, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FileStagingScreen from './components/FileStagingScreen';
import HelpModal from './components/HelpModal';
import HistoryPanel from './components/HistoryPanel';
import { ErrorMessage, LoadingIndicator, MessageRenderer } from './components/Messages';
import Onboarding from './components/Onboarding';
import ProjectContextScreen from './components/ProjectContextScreen';
import Toolbelt from './components/ToolbeltClean';
import { callAI } from './aiClient';
import {
  createChatPayload,
  createToolPayload,
  extractTextFromResponse,
  getMessageParts,
  getThreadTitlePreview,
} from './chatRuntime';
import { parseUploadedFile } from './fileUtils';
import { getRequiredFiles, getReviewPrompt } from './reviewConfig';

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

export default function App() {
  const [appState, setAppState] = useState('onboarding');
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [tempFlow, setTempFlow] = useState(null);
  const [selectedProjectContext, setSelectedProjectContext] = useState(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isEmbed, setIsEmbed] = useState(false);
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const handledMessageIdsRef = useRef(new Set());
  const inFlightRef = useRef(false);
  const lastMessageCountRef = useRef(0);

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
    if (typeof window === 'undefined') return;
    const isEmbedMode = new URLSearchParams(window.location.search).get('embed') === '1';
    setIsEmbed(isEmbedMode);
    if (isEmbedMode) {
      setIsHistoryPanelOpen(false);
      document.body.classList.add('embed-mode');
    }
    return () => {
      document.body.classList.remove('embed-mode');
    };
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
    const currentCount = currentThread?.messages?.length || 0;
    if (currentCount > lastMessageCountRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
    lastMessageCountRef.current = currentCount;
  }, [currentThreadId, currentThread?.messages?.length]);

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

    try {
      const payload = createToolPayload(toolType, currentThread);
      const response = await callAI(payload);
      const result = await response.json();
      const content = extractTextFromResponse(result);

      if (!content) {
        throw new Error('Received an empty or invalid response from OpenAI.');
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

    const definitions = getRequiredFiles(flow);

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
    return (
      <>
        <Onboarding onSelect={handleOnboardingSelect} onOpenHelp={() => setIsHelpOpen(true)} isLoading={isLoading} />
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </>
    );
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
        requiredFiles={getRequiredFiles('process_review')}
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
        requiredFiles={getRequiredFiles('final_review')}
        minOptional={0}
        onSubmit={(files) => handleReviewSubmit(files, 'final_review')}
        onBack={resetToOnboarding}
      />
    );
  }

  return (
    <div className={`bg-black text-gray-200 font-sans flex h-screen antialiased overflow-hidden ${isEmbed ? 'embed-shell' : ''}`}>
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

      <div className="flex-1 flex flex-col transition-all duration-300">
        <header className="border-b-2 border-gray-800 p-4 flex items-center justify-between text-center shrink-0">
          {isEmbed ? (
            <div className="w-10" />
          ) : (
            <button onClick={() => setIsHistoryPanelOpen(true)} className="p-2 text-gray-400 hover:text-white lg:hidden">
              <Book size={20} />
            </button>
          )}
          <h1 className="text-2xl font-bold tracking-wider text-gray-300 mx-auto uppercase font-mono">
            {currentThread?.title || 'Not a Guru'}
          </h1>
          {isEmbed ? (
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-gray-400 hover:text-white"
              aria-label="Open help"
            >
              <HelpCircle size={20} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsHelpOpen(true)}
                className="p-2 text-gray-400 hover:text-white"
                aria-label="Open help"
              >
                <HelpCircle size={20} />
              </button>
              <button
                onClick={() => setIsHistoryPanelOpen((prev) => !prev)}
                className="p-2 text-gray-400 hover:text-white hidden lg:block"
                aria-label="Toggle history"
              >
                <Book size={20} />
              </button>
            </div>
          )}
        </header>

        <main className={`flex-1 overflow-y-auto ${isEmbed ? 'p-4' : 'p-4 md:p-6 lg:p-8'}`}>
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
