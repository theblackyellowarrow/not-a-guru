import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createChatPayload,
  createToolPayload,
  extractTextFromResponse,
  getRecentContextHistory,
} from '../src/chatRuntime.js';

test('createChatPayload keeps recent context short for lightweight chat', () => {
  const thread = {
    flow: 'start_project',
    projectContext: 'class_project',
  };

  const history = Array.from({ length: 12 }, (_, index) => ({
    type: index % 2 === 0 ? 'user' : 'guru',
    text: `message-${index}`,
  }));

  const payload = createChatPayload(thread, history, [{ text: 'hi' }]);

  assert.equal(payload.contents.length, 9);
  assert.match(payload.instructions, /Not a Guru/);
  assert.equal(payload.maxOutputTokens, 180);
});

test('extractTextFromResponse reads text from OpenAI output payloads', () => {
  const text = extractTextFromResponse({
    output: [
      {
        content: [
          { type: 'output_text', text: 'hello' },
          { type: 'output_text', text: ' world' },
        ],
      },
    ],
  });

  assert.equal(text, 'hello world');
});

test('createToolPayload adds structured schema for persona generation', () => {
  const payload = createToolPayload('personas', {
    flow: 'start_project',
    projectContext: 'class_project',
    messages: [{ type: 'guru', text: 'solution statement' }],
  });

  assert.equal(payload.generationConfig.responseMimeType, 'application/json');
  assert.equal(payload.generationConfig.responseSchema.type, 'ARRAY');
});

test('getRecentContextHistory caps history length', () => {
  const history = Array.from({ length: 20 }, (_, index) => ({
    type: 'user',
    text: `message-${index}`,
  }));

  assert.equal(getRecentContextHistory(history, 5).length, 5);
});
