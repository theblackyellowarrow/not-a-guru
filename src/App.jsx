import { Book, HelpCircle, Home, PlusCircle, Send, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FileStagingScreen from './components/FileStagingScreen';
import FirstRunTour from './components/FirstRunTour';
import HelpModal from './components/HelpModal';
import HistoryPanel from './components/HistoryPanel';
import { ErrorMessage, LoadingIndicator, MessageRenderer } from './components/Messages';
import NextQuestCard from './components/NextQuestCard';
import Onboarding from './components/Onboarding';
import QuestTracker from './components/QuestTracker';
import QuickReplies from './components/QuickReplies';
import Toolbelt from './components/ToolbeltClean';
import { callAI } from './aiClient';
import {
  createChatPayload,
  createToolPayload,
  extractTextFromResponse,
  getMessageParts,
  getQuestStageIndex,
  getThreadTitlePreview,
  parsePersonasJson,
} from './chatRuntime';
import { parseUploadedFile } from './fileUtils';
import { getRequiredFiles, getReviewPrompt } from './reviewConfig';

const STORAGE_KEY = 'guru_threads';
const TOUR_KEY = 'guru_seen_tour';

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
  const [selectedProjectContext, setSelectedProjectContext] = useState(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isEmbed, setIsEmbed] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const embedShellRef = useRef(null);
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

  const questStage = useMemo(
    () => (currentThread?.flow === 'start_project' ? getQuestStageIndex(currentThread.messages) : null),
    [currentThread]
  );

  const nextQuest = useMemo(() => {
    if (!currentThread) return null;

    const hasGuruReply = currentThread.messages.some(
      (message) => message.type === 'guru' && message.text !== 'Thinking...'
    );

    if (currentThread.flow === 'start_project' && questStage === 2) {
      return {
        title: 'Next quest unlocked',
        body: 'Problem and solution are on the table. Show the working with a Process Check, or go straight to the Final Roast.',
        actions: [
          { label: 'Process Check', flow: 'process_review' },
          { label: 'Final Roast', flow: 'final_review' },
        ],
      };
    }

    if (currentThread.flow === 'process_review' && hasGuruReply) {
      return {
        title: 'Next quest unlocked',
        body: 'Process traced. Ready to put the final output on the table?',
        actions: [{ label: 'Final Roast', flow: 'final_review' }],
      };
    }

    if (currentThread.flow === 'final_review' && hasGuruReply) {
      return {
        title: 'Run it back',
        body: 'Roast done. Take the notes, fix the work, start a new quest when ready.',
        actions: [{ label: 'Start a New Vibe', flow: 'start_project' }],
      };
    }

    return null;
  }, [currentThread, questStage]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (isEmbed) return;
      const hasSeenTour = localStorage.getItem(TOUR_KEY) === '1';
      if (!hasSeenTour) {
        setIsTourOpen(true);
      }
    } catch {
      // Ignore storage failures; the tour is optional.
    }
  }, [isEmbed]);

  useEffect(() => {
    if (threads.length === 0) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // storage unavailable; nothing to clear
      }
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch (saveError) {
      console.error('Failed to save threads to localStorage', saveError);
      // Likely QuotaExceededError from base64 attachments: prune to the five
      // most recent threads (threads are stored newest-first) and retry once.
      try {
        const pruned = threads.slice(0, 5);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        setError('Local storage is full. Only your 5 most recent threads will persist after reload.');
      } catch {
        setError('Local storage is full. Thread history will not be saved on this device.');
      }
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

  // Quest markers: append a stage-clear divider when the user advances a stage.
  // Idempotent via stageKey so persisted threads never double-mark.
  useEffect(() => {
    if (questStage === null || questStage === 0 || !currentThread) return;

    const stageKey = `quest_stage_${questStage}`;
    const alreadyMarked = currentThread.messages.some(
      (message) => message.type === 'stage_marker' && message.stageKey === stageKey
    );
    if (alreadyMarked) return;

    const markerMessage = {
      id: `marker_${Date.now()}`,
      type: 'stage_marker',
      stageKey,
      text:
        questStage === 1
          ? 'Stage clear: the problem has a name. Now sharpen it.'
          : 'Quest clear: solution on the table. Stress-test it.',
      timestamp: new Date().toISOString(),
    };

    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThread.id
          ? { ...thread, messages: [...thread.messages, markerMessage] }
          : thread
      )
    );
  }, [questStage, currentThread]);

  function resetToOnboarding() {
    setAppState('onboarding');
    setCurrentThreadId(null);
    setSelectedProjectContext(null);
    setInput('');
    setUploadedFile(null);
    setError(null);
  }

  function handleOnboardingSelect(selectedFlow) {
    setIsLoading(true);
    // Default context keeps flow moving; users can refine context later in the conversation.
    handleContextSelect('default', selectedFlow);
  }

  function handleContextSelect(projectContext, explicitFlow) {
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [currentThreadId, input, uploadedFile]);

  function handleQuickReply(text) {
    if (isLoading || isParsing || !currentThread) return;
    handleSendMessage(text);
  }

  function handleNextQuest(flow) {
    if (isLoading) return;
    handleContextSelect('default', flow);
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
    <div
      ref={embedShellRef}
      className={`view-enter bg-black text-gray-200 font-sans flex h-screen antialiased overflow-hidden ${isEmbed ? 'embed-shell' : ''}`}
    >
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
            <button
              onClick={resetToOnboarding}
              className="p-2 text-gray-400 hover:text-white"
              aria-label="New chat"
              title="New chat"
            >
              <PlusCircle size={20} />
            </button>
          ) : (
            <button onClick={() => setIsHistoryPanelOpen(true)} className="p-2 text-gray-400 hover:text-white lg:hidden">
              <Book size={20} />
            </button>
          )}
          <div className="mx-auto flex items-center gap-3">
            <img src="/brand/dotai-logo-mark.png" alt="DotAI" className="h-6 w-auto opacity-90" />
            <h1 className="text-2xl font-bold tracking-wider text-gray-300 uppercase font-mono">
              {currentThread?.title || 'Not a Guru'}
            </h1>
          </div>
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
                onClick={resetToOnboarding}
                className="p-2 text-gray-400 hover:text-white"
                aria-label="Back to home"
                title="Back to home"
              >
                <Home size={20} />
              </button>
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
            {questStage !== null && <QuestTracker stage={questStage} />}
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
            {nextQuest && !isLoading && (
              <NextQuestCard
                title={nextQuest.title}
                body={nextQuest.body}
                actions={nextQuest.actions}
                onSelect={handleNextQuest}
                isLoading={isLoading}
              />
            )}
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
            <QuickReplies
              flow={currentThread?.flow}
              onPick={handleQuickReply}
              disabled={isLoading || isParsing || !currentThread}
            />
            <div className="flex items-center bg-gray-900 p-2 border-2 border-gray-700 focus-within:border-cyan-400">
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
            <div className="mt-3 text-center text-xs text-gray-600 font-mono tracking-widest">
              powered by dotai
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
