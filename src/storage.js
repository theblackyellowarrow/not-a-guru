export const THREAD_MAP_KEY = 'guru_user_threads';
export const USERNAME_KEY = 'guru_username';
export const LAST_THREAD_KEY = (user) => `guru_last_thread_${user}`;
export const TOUR_KEY = 'guru_seen_tour';
export const HERO_KEY = 'guru_seen_hero';

// Version key for hard reset on breaking changes
export const APP_VERSION_KEY = 'guru_app_version';
export const CURRENT_APP_VERSION = '2.0.0'; // Bump to force clear

export const INITIAL_MESSAGES = {
  start_project:
    "Aight, a new idea. Every great project starts with a spark. What's the general problem area you're thinking about? No need for a perfect pitch, just the raw concept.",
  process_review:
    'Right, process critique. Before we tear into the output, walk me through what you actually did — research, decisions, dead ends. Upload docs whenever they help.',
  final_review:
    'Final roast time. Show me the finished piece and the framing that got you here — problem statement, solution, any images or docs. I will be direct.',
};

export const TITLES = {
  start_project: 'Build a Problem Statement',
  process_review: 'Design Process Critique',
  final_review: 'Final Roast',
};

export const FLOW_LABELS = {
  start_project: 'Build a Problem Statement',
  process_review: 'Design Process Critique',
  final_review: 'Final Roast',
};

export function buildPersonalisedGreeting(flow, name) {
  const safeName = (name || '').trim();
  if (!safeName) return INITIAL_MESSAGES[flow];
  switch (flow) {
    case 'start_project':
      return `Welcome, ${safeName}. Aight, a new idea — every great project starts with a spark. What's the general problem area you're thinking about? No need for a perfect pitch, just the raw concept.`;
    case 'process_review':
      return `Welcome, ${safeName}. Process critique time — walk me through what you actually did. Research, decisions, dead ends. Upload docs whenever they help.`;
    case 'final_review':
      return `Welcome, ${safeName}. Final roast incoming. Show me the finished piece and the framing that got you here — problem statement, solution, any images or docs. I will be direct.`;
    default:
      return `Welcome, ${safeName}. ${INITIAL_MESSAGES[flow]}`;
  }
}

export function generateErrorRef() {
  const time = Date.now().toString(36).slice(-4);
  const rand = Math.floor(Math.random() * 0xffff).toString(36).padStart(4, '0');
  return `err-${time}-${rand}`;
}

function loadThreadMap() {
  try {
    const saved = localStorage.getItem(THREAD_MAP_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveThreadMap(map) {
  try {
    localStorage.setItem(THREAD_MAP_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

export function loadUsername() {
  try {
    return localStorage.getItem(USERNAME_KEY) || '';
  } catch {
    return '';
  }
}

export function loadUserThreads(username) {
  const map = loadThreadMap();
  const userThreads = map[username];
  return Array.isArray(userThreads) ? userThreads : [];
}

export function saveUserThreads(username, userThreads) {
  const map = loadThreadMap();
  map[username] = userThreads;
  return saveThreadMap(map);
}

export function setLastActiveThread(username, threadId) {
  try {
    localStorage.setItem(LAST_THREAD_KEY(username), String(threadId));
  } catch {
    // ignore
  }
}

export function getLastActiveThreadId(username) {
  try {
    return localStorage.getItem(LAST_THREAD_KEY(username));
  } catch {
    return null;
  }
}

// Hard reset: clear all app data
export function clearAllAppData() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith('guru_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    return true;
  } catch {
    return false;
  }
}

// Check version and clear if mismatch (forces fresh start on deploys)
export function checkVersionAndClear() {
  try {
    const storedVersion = localStorage.getItem(APP_VERSION_KEY);
    if (storedVersion !== CURRENT_APP_VERSION) {
      clearAllAppData();
      localStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION);
      return true; // Was cleared
    }
    return false; // No change needed
  } catch {
    return false;
  }
}
