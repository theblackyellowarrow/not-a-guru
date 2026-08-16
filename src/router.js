// Hash-based URL router for the SPA.
// Keeps routing client-side so no server rewrites are needed.

export const ROUTES = {
  HOME: 'home',
  CHAT: 'chat',
};

export function readRoute() {
  if (typeof window === 'undefined') {
    return { route: ROUTES.HOME };
  }

  const hash = window.location.hash.replace(/^#\/?/, '') || '';
  const [route, ...rest] = hash.split('/');
  const param = rest.join('/');

  if (route === 'chat' && param) {
    return { route: ROUTES.CHAT, threadId: Number(param) || null };
  }

  return { route: ROUTES.HOME };
}

export function setChatRoute(threadId) {
  if (typeof window === 'undefined') return;
  const target = `#/chat/${threadId}`;
  if (window.location.hash !== target) {
    window.location.hash = target;
  }
}

export function clearRoute() {
  if (typeof window === 'undefined') return;
  window.location.hash = '';
}
