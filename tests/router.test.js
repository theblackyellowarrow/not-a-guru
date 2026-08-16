import test from 'node:test';
import assert from 'node:assert/strict';

import { ROUTES, readRoute, setChatRoute, clearRoute } from '../src/router.js';

function withStubbedHash(initialHash, fn) {
  const previousWindow = globalThis.window;
  const previousLocation = globalThis.location;

  let writes = 0;
  const location = { _hash: initialHash };
  Object.defineProperty(location, 'hash', {
    get() {
      return this._hash;
    },
    set(value) {
      this._hash = value;
      writes += 1;
    },
    configurable: true,
  });

  globalThis.window = { location };
  globalThis.location = location;

  const restore = () => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousLocation === undefined) delete globalThis.location;
    else globalThis.location = previousLocation;
  };

  try {
    fn({ writes: () => writes });
  } finally {
    restore();
  }
}

test('readRoute returns HOME for an empty hash', () => {
  withStubbedHash('', () => {
    assert.deepEqual(readRoute(), { route: ROUTES.HOME });
  });
});

test('readRoute returns HOME for a stray slash', () => {
  withStubbedHash('#/', () => {
    assert.deepEqual(readRoute(), { route: ROUTES.HOME });
  });
});

test('readRoute parses a chat thread id from the hash', () => {
  withStubbedHash('#/chat/42', () => {
    assert.deepEqual(readRoute(), { route: ROUTES.CHAT, threadId: 42 });
  });
});

test('readRoute returns null threadId when the chat param is not a number', () => {
  withStubbedHash('#/chat/abc', () => {
    assert.deepEqual(readRoute(), { route: ROUTES.CHAT, threadId: null });
  });
});

test('readRoute falls back to HOME for an unknown route segment', () => {
  withStubbedHash('#/settings/3', () => {
    assert.deepEqual(readRoute(), { route: ROUTES.HOME });
  });
});

test('setChatRoute writes the expected hash without looping', () => {
  withStubbedHash('', ({ writes }) => {
    setChatRoute(7);
    assert.equal(globalThis.window.location.hash, '#/chat/7');
    setChatRoute(7);
    assert.equal(globalThis.window.location.hash, '#/chat/7');
    assert.equal(writes(), 1);
  });
});

test('clearRoute empties the hash', () => {
  withStubbedHash('#/chat/9', () => {
    clearRoute();
    assert.equal(globalThis.window.location.hash, '');
  });
});
