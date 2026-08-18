import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HERO_KEY,
  TOUR_KEY,
  buildPersonalisedGreeting,
  checkVersionAndClear,
  getLastActiveThreadId,
  loadUserThreads,
  loadUsername,
  saveUserThreads,
  setLastActiveThread,
} from '../storage';
import { getFlowStageIndex } from '../chatRuntime';
import { clearRoute, readRoute, setChatRoute } from '../router';

const SAVE_STATUS_TICK_MS = 60 * 1000;

export default function useAppSession() {
  const [appState, setAppState] = useState('onboarding');
  const [username, setUsername] = useState('');
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isEmbed, setIsEmbed] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [heroDismissed, setHeroDismissed] = useState(() => {
    try {
      return localStorage.getItem(HERO_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ state: 'idle', at: null });
  const [error, setError] = useState(null);

  const [tickNow, setTickNow] = useState(() => Date.now());

  // Initial load + reduced-motion subscription.
  useEffect(() => {
    // Hard reset on version mismatch
    const wasCleared = checkVersionAndClear();
    if (wasCleared) {
      console.log('[Not a Guru] Storage cleared for new version');
    }

    let cleanupMotion;
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mq.matches);
        const handler = (event) => setPrefersReducedMotion(event.matches);
        if (typeof mq.addEventListener === 'function') {
          mq.addEventListener('change', handler);
          cleanupMotion = () => mq.removeEventListener('change', handler);
        }
      }
    } catch {
      // ignore
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const isEmbedMode = params.get('embed') === '1';
      setIsEmbed(isEmbedMode);
      if (isEmbedMode) {
        document.body.classList.add('embed-mode');
      }
    } catch {
      // ignore
    }

    try {
      const storedUsername = loadUsername();
      const userThreads = storedUsername ? loadUserThreads(storedUsername) : [];
      setUsername(storedUsername);
      setThreads(userThreads);

      if (storedUsername && userThreads.length > 0) {
        const route = readRoute();
        let targetId = null;
        if (route.route === 'chat' && route.threadId) {
          const match = userThreads.find((thread) => thread.id === route.threadId);
          if (match) targetId = match.id;
        }
        if (!targetId) {
          const lastId = getLastActiveThreadId(storedUsername);
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
      cleanupMotion?.();
      try {
        document.body.classList.remove('embed-mode');
      } catch {
        // ignore
      }
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

  // Sync URL hash + last-active thread.
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
    if (!isEmbed || typeof window === 'undefined') return undefined;

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

  // Save-status tick.
  useEffect(() => {
    const interval = window.setInterval(() => setTickNow(Date.now()), SAVE_STATUS_TICK_MS);
    return () => window.clearInterval(interval);
  }, []);

  const currentThread = useMemo(
    () => threads.find((thread) => thread.id === currentThreadId),
    [threads, currentThreadId]
  );

  const currentStage = useMemo(
    () => (currentThread ? getFlowStageIndex(currentThread.flow, currentThread.messages) : -1),
    [currentThread]
  );

  const lastThreadTitle = useMemo(() => {
    const lastId = getLastActiveThreadId(username);
    const match = threads.find((thread) => thread.id === Number(lastId));
    return match ? match.title : threads[0]?.title || null;
  }, [threads, username]);

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

  const dismissHero = useCallback(() => {
    try {
      localStorage.setItem(HERO_KEY, '1');
    } catch {
      // ignore
    }
    setHeroDismissed(true);
  }, []);

  const setUsernameAndLoad = useCallback((newUsername) => {
    const trimmed = newUsername.trim();
    if (!trimmed) return;

    try {
      localStorage.setItem('guru_username', trimmed);
    } catch {
      // ignore
    }
    setUsername(trimmed);

    const userThreads = loadUserThreads(trimmed);
    setThreads(userThreads);

    if (userThreads.length > 0) {
      const lastId = getLastActiveThreadId(trimmed);
      const match = userThreads.find((thread) => thread.id === Number(lastId));
      setCurrentThreadId(match ? match.id : userThreads[0].id);
      setAppState('chat');
    } else {
      // New user: show flow selector instead of onboarding
      setAppState('flowSelector');
    }
  }, []);

  const continueSession = useCallback(() => {
    if (!currentThreadId && threads.length > 0) {
      setCurrentThreadId(threads[0].id);
    }
    setAppState('chat');
  }, [currentThreadId, threads]);

  const resetToOnboarding = useCallback(() => {
    setAppState('onboarding');
    setCurrentThreadId(null);
    setError(null);
  }, []);

  const selectThread = useCallback((threadId) => {
    setCurrentThreadId(threadId);
    setAppState('chat');
  }, []);

  return {
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
    buildPersonalisedGreeting,
  };
}
