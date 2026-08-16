import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createChatPayload,
  createScorePayload,
  createToolPayload,
  createWorkflowPayload,
  extractTextFromResponse,
  getQuestStageIndex,
  getRecentContextHistory,
  parsePersonasJson,
  stripMarkers,
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
  assert.equal(payload.maxOutputTokens, 240);
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

test('createToolPayload wraps personas in an object schema', () => {
  const payload = createToolPayload('personas', {
    flow: 'start_project',
    projectContext: 'class_project',
    messages: [{ type: 'guru', text: 'solution statement' }],
  });

  assert.equal(payload.generationConfig.responseMimeType, 'application/json');
  assert.equal(payload.generationConfig.responseSchema.type, 'OBJECT');
  assert.equal(payload.generationConfig.responseSchema.properties.personas.type, 'ARRAY');
});

test('createScorePayload requests structured problem-statement scoring', () => {
  const payload = createScorePayload(
    {
      flow: 'start_project',
      projectContext: 'class_project',
      messages: [
        { type: 'guru', text: 'What is the problem area?' },
        { type: 'user', text: 'housing is unaffordable' },
      ],
    },
    'Housing is unaffordable for young renters in this city.'
  );

  assert.match(payload.instructions, /scoring a problem statement/);
  assert.equal(payload.generationConfig.responseSchema.type, 'OBJECT');
  assert.ok(payload.generationConfig.responseSchema.properties.score);
  assert.ok(payload.contents[payload.contents.length - 1].parts[0].text.includes('Housing is unaffordable'));
});

test('createWorkflowPayload requests structured future workflow', () => {
  const payload = createWorkflowPayload({
    flow: 'start_project',
    projectContext: 'class_project',
    messages: [
      { type: 'guru', text: '### SOLUTION_STATEMENT_READY' },
      { type: 'user', text: 'Our solution is a tenant coalition app.' },
    ],
  });

  assert.match(payload.instructions, /proposing a future workflow/);
  assert.equal(payload.generationConfig.responseSchema.type, 'OBJECT');
  assert.ok(payload.generationConfig.responseSchema.properties.workflow);
  assert.ok(payload.generationConfig.responseSchema.properties.risks);
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
    '```json\n{"personas":[{"name":"Asha","demographic":"29, Pune, nurse","needs":["a"],"frustrations":["b"],"quote":"q"}]}\n```'
  );

  assert.equal(personas.length, 1);
  assert.equal(personas[0].name, 'Asha');
});

test('parsePersonasJson still accepts a raw personas array', () => {
  const personas = parsePersonasJson(
    '[{"name":"Asha","demographic":"29, Pune, nurse","needs":["a"],"frustrations":["b"],"quote":"q"}]'
  );

  assert.equal(personas.length, 1);
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

test('getQuestStageIndex advances through problem then solution markers', () => {
  const messages = [{ type: 'guru', text: 'What is the problem area?' }];
  assert.equal(getQuestStageIndex(messages), 0);

  messages.push({ type: 'guru', text: 'Good.\n### PROBLEM_STATEMENT_READY' });
  assert.equal(getQuestStageIndex(messages), 1);

  messages.push({ type: 'guru', text: 'Now the solution.\n### SOLUTION_STATEMENT_READY' });
  assert.equal(getQuestStageIndex(messages), 2);
});

test('getQuestStageIndex ignores stage markers and user text', () => {
  const messages = [
    { type: 'stage_marker', text: '### SOLUTION_STATEMENT_READY', stageKey: 'quest_stage_2' },
    { type: 'user', text: 'my solution statement draft' },
  ];
  assert.equal(getQuestStageIndex(messages), 0);
});

test('stripMarkers removes stage markers from rendered text', () => {
  const text = 'Great work.\n### PROBLEM_STATEMENT_READY\n\nNext question.';
  const cleaned = stripMarkers(text);

  assert.ok(!cleaned.includes('### PROBLEM_STATEMENT_READY'));
  assert.ok(cleaned.includes('Great work.'));
  assert.ok(cleaned.includes('Next question.'));
});
