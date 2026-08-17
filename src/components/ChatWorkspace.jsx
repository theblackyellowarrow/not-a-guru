import { useEffect, useMemo, useRef, useState } from 'react';
import { Book, HelpCircle, Home, PlusCircle, Send, Upload, X } from 'lucide-react';
import { ErrorMessage, LoadingIndicator, MessageRenderer, ToolActivity } from './Messages';
import NextQuestCard from './NextQuestCard';
import OrbitMark from './OrbitMark';
import QuestTracker from './QuestTracker';
import QuickReplies from './QuickReplies';
import Toolbelt from './Toolbelt';
import CertificateCard from './CertificateCard';
import GeometricBackdrop from './GeometricBackdrop';
import HelpModal from './HelpModal';
import HistoryPanel from './HistoryPanel';
import { FLOW_LABELS } from '../storage';
import { MODEL_NAME } from '../config';
import { getFlowStageIndex, getFlowStages } from '../chatRuntime';

function buildProcessMeta(thread, messageIndex) {
  if (!thread || typeof messageIndex !== 'number') return null;
  const messages = thread.messages || [];
  const prior = messages.slice(0, messageIndex);
  const userTurns = prior.filter((message) => message.type === 'user').length;
  const attachmentCount = prior.reduce((count, message) => {
    const atts = message.attachments || (message.file ? [message.file] : []);
    return count + atts.length;
  }, 0);
  const stageIndex = getFlowStageIndex(thread.flow, prior.concat([{ type: 'guru', text: '' }]));
  const stages = getFlowStages(thread.flow);

  return {
    model: MODEL_NAME,
    flow: FLOW_LABELS[thread.flow] || thread.flow,
    stage: stages[stageIndex] || '—',
    turn: userTurns,
    attachments: attachmentCount,
  };
}

function buildNextQuest(thread, currentStage, hasWorkflowCard) {
  if (!thread) return null;
  const stages = getFlowStages(thread.flow);
  const questClear = currentStage >= stages.length - 1;

  const hasGuruReply = thread.messages.some(
    (message) => message.type === 'guru' && message.text !== 'Thinking...'
  );

  if (thread.flow === 'start_project' && hasWorkflowCard) {
    return {
      title: 'Quest clear',
      body: 'Problem, solution, and workflow are on the table. Now stress-test the process or roast the final output.',
      actions: [
        { label: 'Process Critique', flow: 'process_review' },
        { label: 'Final Roast', flow: 'final_review' },
      ],
    };
  }

  if (thread.flow === 'process_review' && questClear) {
    return {
      title: 'Next quest unlocked',
      body: 'Process traced. Ready to put the final output on the table?',
      actions: [{ label: 'Final Roast', flow: 'final_review' }],
    };
  }

  if (thread.flow === 'process_review' && hasGuruReply) {
    return {
      title: 'Keep tracing',
      body: 'You can keep interrogating the process, or move on to the final roast.',
      actions: [{ label: 'Final Roast', flow: 'final_review' }],
    };
  }

  if (thread.flow === 'final_review' && questClear) {
    return {
      title: 'Run it back',
      body: 'Roast done. Take the notes, fix the work, start a new quest when ready.',
      actions: [{ label: 'Build a Problem Statement', flow: 'start_project' }],
    };
  }

  if (thread.flow === 'final_review' && hasGuruReply) {
    return {
      title: 'Keep roasting',
      body: 'Keep digging into the final output, or start a new framing session.',
      actions: [{ label: 'Build a Problem Statement', flow: 'start_project' }],
    };
  }

  return null;
}

export default function ChatWorkspace({
  username,
  currentThread,
  currentThreadId,
  currentStage,
  isEmbed,
  saveStatusLabel,
  saveStatus,
  error,
  setError,
  runner,
  toolPhase,
  threads,
  onOpenHelp,
  onResetToOnboarding,
  onOpenHistory,
  onToggleHistory,
  onSelectThread,
  onParseFile,
  onSendMessage,
  onQuickReply,
  onReviseFrom,
  onCancelRevision,
  onRepeatProblemBuilder,
  onNextQuest,
  onUseTool,
  isHistoryPanelOpen,
  setIsHistoryPanelOpen,
}) {
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [revisingFromMessage, setRevisingFromMessage] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  const hasWorkflowCard = useMemo(
    () => currentThread?.messages?.some((message) => message.type === 'workflow_card') ?? false,
    [currentThread]
  );

  const nextQuest = useMemo(
    () => buildNextQuest(currentThread, currentStage, hasWorkflowCard),
    [currentThread, currentStage, hasWorkflowCard]
  );

  const isBusy = runner.isBusy;
  const isParsing = false;

  // Scroll to bottom when new messages arrive.
  const messageCount = currentThread?.messages?.length || 0;
  useEffect(() => {
    if (messageCount > lastMessageCountRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
    lastMessageCountRef.current = messageCount;
  }, [currentThreadId, messageCount]);

  const handleSend = () => {
    if (isBusy) return;
    onSendMessage({ text: input, attachments: uploadedFile ? [uploadedFile] : [], currentThreadId });
    setInput('');
    setUploadedFile(null);
    setRevisingFromMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQuickReply = (text) => {
    if (isBusy || !currentThread) return;
    onQuickReply(text);
  };

  const handleReviseFrom = (message) => {
    if (isBusy || !currentThread) return;
    if (!message || typeof message.text !== 'string') return;
    setRevisingFromMessage(message);
    setInput(message.text);
  };

  const handleCancelRevision = () => {
    setRevisingFromMessage(null);
    setInput('');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsedFile = await onParseFile(file);
      setUploadedFile(parsedFile);
    } catch (parseError) {
      setError({ message: parseError.message, refId: null });
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className={`view-enter bg-[#090909] text-white flex h-screen antialiased overflow-hidden ${isEmbed ? 'embed-shell' : ''}`}
    >
      <GeometricBackdrop />
      <HelpModal isOpen={false} onClose={() => {}} />
      {!isEmbed && (
        <HistoryPanel
          threads={threads}
          currentThreadId={currentThreadId}
          onSelectThread={onSelectThread}
          onNewChat={onResetToOnboarding}
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
              onClick={onResetToOnboarding}
              className="p-2 text-[#C8C5BF] hover:text-white transition-colors"
              aria-label="New chat"
              title="New chat"
            >
              <PlusCircle size={20} />
            </button>
          ) : (
            <button
              onClick={onOpenHistory}
              className="p-2 text-[#C8C5BF] hover:text-white transition-colors lg:hidden"
              aria-label="Open history"
            >
              <Book size={20} />
            </button>
          )}

          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <OrbitMark size={26} />
              <img src="/brand/dotai-logo-mark.png" alt="dotai" className="h-6 w-auto opacity-90" />
              <h1 className="text-lg sm:text-xl font-semibold tracking-widest text-white uppercase font-mono">
                {currentThread?.title || 'Not a Guru'}
              </h1>
            </div>
            {username && (
              <span className="text-[10px] uppercase font-mono tracking-[0.18em] text-[#FF00A8]">
                Hi, {username}
              </span>
            )}
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
              onClick={onOpenHelp}
              className="p-2 text-[#C8C5BF] hover:text-white transition-colors"
              aria-label="Open help"
            >
              <HelpCircle size={20} />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={onResetToOnboarding}
                className="p-2 text-[#C8C5BF] hover:text-white transition-colors"
                aria-label="Back to home"
                title="Back to home"
              >
                <Home size={20} />
              </button>
              <button
                onClick={onOpenHelp}
                className="p-2 text-[#C8C5BF] hover:text-white transition-colors"
                aria-label="Open help"
              >
                <HelpCircle size={20} />
              </button>
              <button
                onClick={onToggleHistory}
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
                isLoading={runner.isLoading}
                isLastMessage={index === currentThread.messages.length - 1}
                onRepeat={onRepeatProblemBuilder}
                onReviseFrom={
                  message.type === 'user' && index !== currentThread.messages.length - 1
                    ? handleReviseFrom
                    : undefined
                }
                process={
                  message.type === 'guru'
                    ? buildProcessMeta(currentThread, index)
                    : null
                }
              />
            ))}
            <ToolActivity phase={toolPhase} />
            {(runner.isLoading || runner.isScoring || runner.isWorkflowing) &&
              (!currentThread || currentThread.messages.length === 0) && <LoadingIndicator />}
            <Toolbelt
              messages={currentThread?.messages || []}
              flow={currentThread?.flow}
              onToolUse={onUseTool}
              isLoading={runner.isBusy}
            />
            <CertificateCard thread={currentThread} username={username} />
            {nextQuest && !runner.isBusy && (
              <NextQuestCard
                title={nextQuest.title}
                body={nextQuest.body}
                actions={nextQuest.actions}
                onSelect={onNextQuest}
                isLoading={runner.isBusy}
              />
            )}
            <div ref={chatEndRef} />
          </div>
        </main>

        {/* Composer */}
        <footer className="border-t border-[#6B6965] bg-[#090909] px-4 py-3 shrink-0 z-10">
          <div className="max-w-3xl mx-auto">
            {error && <ErrorMessage error={error} onClose={() => setError(null)} />}
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
                  onClick={handleCancelRevision}
                  className="text-[#FF00A8]/70 hover:text-white transition-colors"
                  aria-label="Cancel revision"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {(runner.isScoring || runner.isWorkflowing) && (
              <div className="mb-2 text-center text-xs uppercase font-mono tracking-widest text-[#FF00A8] animate-pulse">
                {runner.isScoring ? 'Scoring stage…' : 'Building workflow…'}
              </div>
            )}
            <QuickReplies
              flow={currentThread?.flow}
              onPick={handleQuickReply}
              disabled={runner.isBusy || !currentThread}
            />

            <div className="relative flex flex-col border border-[#F7F5F0] focus-within:border-[#00F1DE] focus-within:border-b-2 bg-[#090909] transition-colors">
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
                  disabled={isParsing || runner.isBusy}
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
                      handleSend();
                    }
                  }}
                  placeholder={isParsing ? 'Reading your file…' : 'What are you trying to understand?'}
                  className="flex-1 bg-transparent px-3 py-2 text-base text-white placeholder-[#6B6965] focus:outline-none font-[var(--font-ui)]"
                />
                <button
                  onClick={handleSend}
                  disabled={runner.isBusy}
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
