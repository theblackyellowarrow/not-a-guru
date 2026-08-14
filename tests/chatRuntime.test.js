import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createChatPayload,
  createToolPayload,
  extractTextFromResponse,
  getQuestStageIndex,
  getRecentContextHistory,
  parsePersonasJson,
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

test('parsePersonasJson strips markdown fences around model JSON', () => {
  const personas = parsePersonasJson(
    '```json\n[{"name":"Asha","demographic":"29, Pune, nurse","needs":["a"],"frustrations":["b"],"quote":"q"}]\n```'
  );

  assert.equal(personas.length, 1);
  assert.equal(personas[0].name, 'Asha');
});

test('parsePersonasJson rejects non-array payloads', () => {
  assert.throws(() => parsePersonasJson('{"name":"Asha"}'), /not a list/);
});

test('parsePersonasJson rejects malformed JSON', () => {
  assert.throws(() => parsePersonasJson('not json at all'));
});

test('getQuestStageIndex starts at zero without milestones', () => {
  assert.equal(getQuestStageIndex([]), 0);
  assert.equal(getQuestStageIndex([{ type: 'guru', text: 'Tell me the rough idea.' }]), 0);
});

test('getQuestStageIndex advances through problem then solution stages', () => {
  const messages = [
    { type: 'guru', text: 'What is the problem area?' },
    { type: 'user', text: 'housing' },
    { type: 'guru', text: 'So your problem statement needs evidence.' },
  ];
  assert.equal(getQuestStageIndex(messages), 1);

  messages.push({ type: 'guru', text: 'Now write the solution statement.' });
  assert.equal(getQuestStageIndex(messages), 2);
});

test('getQuestStageIndex ignores stage markers and user text', () => {
  const messages = [
    { type: 'stage_marker', text: 'solution statement', stageKey: 'quest_stage_2' },
    { type: 'user', text: 'my solution statement draft' },
  ];
  assert.equal(getQuestStageIndex(messages), 0);
});
