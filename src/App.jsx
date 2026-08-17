import { useCallback, useMemo, useState } from 'react';
import FirstRunTour from './components/FirstRunTour';
import HelpModal from './components/HelpModal';
import GeometricBackdrop from './components/GeometricBackdrop';
import LandingHero from './components/LandingHero';
import Onboarding from './components/Onboarding';
import ChatWorkspace from './components/ChatWorkspace';
import { parseUploadedFile } from './fileUtils';
import { TOUR_KEY } from './storage';
import useAppSession from './hooks/useAppSession';
import useThreadRunner from './hooks/useThreadRunner';

export default function App() {
  const session = useAppSession();
  const {
    appState,
    setAppState,
    username,
    threads,
    setThreads,
    currentThreadId,
    setCurrentThreadId,
    currentThread,
    currentStage,
    lastThreadTitle,
    saveStatusLabel,
    saveStatus,
    error,
    setError,
    isEmbed,
    isTourOpen,
    setIsTourOpen,
    heroDismissed,
    prefersReducedMotion,
    setUsernameAndLoad,
    continueSession,
    resetToOnboarding,
    selectThread,
    dismissHero,
  } = session;

  const runner = useThreadRunner({
    username,
    currentThread,
    currentThreadId,
    currentStage,
    setThreads,
    setError,
  });

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const handleParseFile = useCallback(
    async (file) => {
      setIsParsing(true);
      try {
        const parsed = await parseUploadedFile(file);
        return parsed;
      } finally {
        setIsParsing(false);
      }
    },
    []
  );

  const handleSendMessage = useCallback(
    ({ text, attachments, currentThreadId: threadId }) => {
      runner.sendUserMessage({ text, attachments, currentThreadId: threadId });
    },
    [runner]
  );

  const handleQuickReply = useCallback(
    (text) => {
      runner.sendUserMessage({ text, attachments: [], currentThreadId });
    },
    [runner, currentThreadId]
  );

  const handleNextQuest = useCallback(
    (flow) => {
      if (runner.isBusy) return;
      const newThread = runner.startThread('default', flow);
      setCurrentThreadId(newThread.id);
      setAppState('chat');
    },
    [runner, setCurrentThreadId]
  );

  const handleOnboardingSelect = useCallback(
    (selectedFlow) => {
      const newThread = runner.startThread('default', selectedFlow);
      setCurrentThreadId(newThread.id);
      setAppState('chat');
    },
    [runner, setCurrentThreadId]
  );

  const handleRepeatProblemBuilder = useCallback(() => {
    runner.repeatProblemBuilder();
  }, [runner]);

  const handleUseTool = useCallback(
    (toolType) => runner.useTool(toolType),
    [runner]
  );

  const handleReviseFrom = useCallback(() => {
    // Revision is handled inside ChatWorkspace's local state.
  }, []);

  const toolPhase = useMemo(() => {
    if (runner.isWorkflowing) return 'Building workflow…';
    if (runner.isScoring) return 'Scoring stage…';
    if (runner.isLoading) return 'Reading conversation…';
    return null;
  }, [runner.isWorkflowing, runner.isScoring, runner.isLoading]);

  // First-load landing hero. Skipped entirely in embed mode — embed contexts
  // are expected to drop the user straight into a tool instance.
  if (!heroDismissed && !isEmbed) {
    return <LandingHero reducedMotion={prefersReducedMotion} onEnter={dismissHero} />;
  }

  if (appState === 'onboarding') {
    return (
      <>
        <Onboarding
          username={username}
          lastThreadTitle={lastThreadTitle}
          onSetUsername={setUsernameAndLoad}
          onContinueSession={continueSession}
          onSelect={handleOnboardingSelect}
          onOpenHelp={() => setIsHelpOpen(true)}
          isLoading={runner.isBusy}
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
    <>
      <ChatWorkspace
        username={username}
        currentThread={currentThread}
        currentThreadId={currentThreadId}
        currentStage={currentStage}
        isEmbed={isEmbed}
        saveStatusLabel={saveStatusLabel}
        saveStatus={saveStatus}
        error={error}
        setError={setError}
        runner={runner}
        toolPhase={toolPhase}
        threads={threads}
        onOpenHelp={() => setIsHelpOpen(true)}
        onResetToOnboarding={resetToOnboarding}
        onOpenHistory={() => setIsHistoryPanelOpen(true)}
        onToggleHistory={() => setIsHistoryPanelOpen((prev) => !prev)}
        onSelectThread={selectThread}
        onParseFile={handleParseFile}
        onSendMessage={handleSendMessage}
        onQuickReply={handleQuickReply}
        onReviseFrom={handleReviseFrom}
        onCancelRevision={() => {}}
        onRepeatProblemBuilder={handleRepeatProblemBuilder}
        onNextQuest={handleNextQuest}
        onUseTool={handleUseTool}
        isHistoryPanelOpen={isHistoryPanelOpen}
        setIsHistoryPanelOpen={setIsHistoryPanelOpen}
      />
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
