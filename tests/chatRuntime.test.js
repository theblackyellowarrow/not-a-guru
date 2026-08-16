import test from 'node:test';
import assert from 'node:assert/strict';

import {
  confidenceLabelFor,
  createChatPayload,
  createStageScorePayload,
  createToolPayload,
  createWorkflowPayload,
  extractTextFromResponse,
  getFlowStageIndex,
  getRecentContextHistory,
  parsePersonasJson,
  safeJsonParse,
  stripJsonFences,
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

test('stripJsonFences strips ```json fences and leaves raw JSON untouched', () => {
  assert.equal(stripJsonFences('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(stripJsonFences('  ```\n{"a":1}  ```  '), '{"a":1}');
  assert.equal(stripJsonFences('{"a":1}'), '{"a":1}');
  assert.equal(stripJsonFences(null), '');
});

test('safeJsonParse parses fenced or raw JSON and surfaces a labelled error on failure', () => {
  assert.deepEqual(safeJsonParse('```json\n{"score":82}\n```', 'score'), { score: 82 });
  assert.deepEqual(safeJsonParse('{"score":82}', 'score'), { score: 82 });
  assert.throws(() => safeJsonParse('not json at all', 'workflow'), /workflow/);
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

test('getFlowStageIndex tracks start_project milestones', () => {
  const messages = [{ type: 'guru', text: 'What is the problem area?' }];
  assert.equal(getFlowStageIndex('start_project', messages), 0);

  messages.push({ type: 'guru', text: 'Good.\n### PROBLEM_STATEMENT_READY' });
  assert.equal(getFlowStageIndex('start_project', messages), 1);

  messages.push({ type: 'guru', text: 'Now the solution.\n### SOLUTION_STATEMENT_READY' });
  assert.equal(getFlowStageIndex('start_project', messages), 2);
});

test('getFlowStageIndex tracks process_review milestones', () => {
  const messages = [{ type: 'guru', text: 'Walk me through your process.' }];
  assert.equal(getFlowStageIndex('process_review', messages), 0);

  messages.push({ type: 'guru', text: 'The framing seems solid.\n### PROCESS_FRAMING_REVIEWED' });
  assert.equal(getFlowStageIndex('process_review', messages), 1);

  messages.push({ type: 'guru', text: 'Now evidence.\n### PROCESS_EVIDENCE_REVIEWED' });
  assert.equal(getFlowStageIndex('process_review', messages), 2);
});

test('createStageScorePayload requests structured stage scoring', () => {
  const payload = createStageScorePayload(
    {
      flow: 'process_review',
      projectContext: 'class_project',
      messages: [{ type: 'guru', text: 'What is the framing?' }, { type: 'user', text: 'We focused on housing.' }],
    },
    'Framing Check',
    'We focused on housing affordability.'
  );

  assert.match(payload.instructions, /Framing Check/);
  assert.equal(payload.generationConfig.responseSchema.type, 'OBJECT');
  assert.ok(payload.contents[payload.contents.length - 1].parts[0].text.includes('housing'));
});

test('stripMarkers drops stage control lines but keeps surrounding text', () => {
  const text = 'Sharp observation.\n### PROBLEM_STATEMENT_READY\n\nNext step.';
  assert.equal(stripMarkers(text), 'Sharp observation.\n\nNext step.');
});

test('confidence bands map scores to grounded labels per §11.1', () => {
  const bands = {
    95: 'Directly supported',
    80: 'Directly supported',
    79: 'Supported across sources',
    60: 'Supported across sources',
    59: 'Interpretive',
    40: 'Interpretive',
    39: 'Contested',
    20: 'Contested',
    19: 'Source missing',
    0: 'Source missing',
  };
  for (const [score, expected] of Object.entries(bands)) {
    assert.equal(
      confidenceLabelFor(Number(score)),
      expected,
      `score ${score} should map to ${expected}`
    );
  }
});

