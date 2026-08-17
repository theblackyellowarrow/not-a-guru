import {
  FLOW_MARKERS,
  FLOW_STAGES,
  TRIAGE_INSTRUCTIONS,
  TRIAGE_MARKERS,
  getChatInstructions,
  getStageScoreInstructions,
  getToolInstructions,
  getToolPrompt,
  getWorkflowInstructions,
  MARKERS,
  PERSONAS_SCHEMA,
  STAGE_SCORE_SCHEMA,
  WORKFLOW_SCHEMA,
} from './personaPrompt.js';

export function getThreadTitlePreview(messageText, attachments = []) {
  if (messageText) {
    return `${messageText.substring(0, 40)}${messageText.length > 40 ? '...' : ''}`;
  }

  if (attachments.length > 0) {
    return attachments[0].name;
  }

  return 'New Thread';
}

export function generateId(prefix = 'id') {
  const time = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 0xffffff).toString(36).padStart(4, '0');
  return `${prefix}_${time}_${rand}`;
}

let threadCounter = 0;
export function generateThreadId() {
  threadCounter += 1;
  return Date.now() * 1000 + (threadCounter % 1000);
}

export function buildAttachmentParts(attachment) {
  const attachmentLabel = attachment.label ? `${attachment.label} (${attachment.name})` : attachment.name;

  if (attachment.base64) {
    return [
      { text: `Attached file: ${attachmentLabel}. Critically analyse it in context.` },
      {
        inlineData: {
          mimeType: attachment.type,
          data: attachment.base64,
        },
      },
    ];
  }

  if (attachment.content) {
    return [
      {
        text: `Attached file: ${attachmentLabel}. Extracted text:\n\n${attachment.content.trim()}`,
      },
    ];
  }

  return [{ text: `Attached file: ${attachmentLabel}.` }];
}

export function getMessageParts(message) {
  const parts = [];

  if (typeof message.text === 'string' && message.text.trim()) {
    parts.push({ text: message.text.trim() });
  }

  const attachments = message.attachments || (message.file ? [message.file] : []);
  attachments.forEach((attachment) => {
    parts.push(...buildAttachmentParts(attachment));
  });

  if (message.type === 'tool_personas' && Array.isArray(message.personas)) {
    parts.push({
      text: `Draft personas JSON:\n${JSON.stringify(message.personas, null, 2)}`,
    });
  }

  return parts;
}

export function buildContextHistory(messages) {
  return messages
    .map((message) => {
      const parts = getMessageParts(message);
      if (parts.length === 0) return null;

      return {
        role: message.type === 'user' ? 'user' : 'model',
        parts,
      };
    })
    .filter(Boolean);
}

export function getRecentContextHistory(messages, limit = 8) {
  return buildContextHistory(messages.slice(-limit));
}

export function extractTextFromResponse(result) {
  if (!result || typeof result !== 'object') {
    return '';
  }

  if (typeof result.text === 'string') {
    return result.text.trim();
  }

  if (Array.isArray(result.output)) {
    return result.output
      .flatMap((item) => item.content || [])
      .map((contentItem) => contentItem.text || contentItem.value || '')
      .join('')
      .trim();
  }

  if (Array.isArray(result.choices)) {
    return result.choices
      .flatMap((choice) => choice.message?.content || choice.text || [])
      .map((part) => (typeof part === 'string' ? part : part.text || ''))
      .join('')
      .trim();
  }

  return '';
}

export async function parseAIResponse(response, { label = 'response' } = {}) {
  try {
    const result = await response.json();
    const text = extractTextFromResponse(result);
    if (!text) {
      throw new Error(`The model ${label} was empty.`);
    }
    return text;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`The model ${label} could not be parsed as JSON.`);
    }
    throw error;
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripMarkers(text = '') {
  const allMarkers = [...Object.values(MARKERS), ...FLOW_MARKERS.process_review, ...FLOW_MARKERS.final_review];
  let cleaned = text;
  allMarkers.forEach((marker) => {
    cleaned = cleaned.replace(new RegExp(`^\\s*${escapeRegex(marker)}\\s*$`, 'gim'), '');
  });
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

export function stripTriageMarker(text = '') {
  let cleaned = text;
  for (const marker of Object.values(TRIAGE_MARKERS)) {
    cleaned = cleaned.replace(new RegExp(`^\\s*${escapeRegex(marker)}\\s*$`, 'gim'), '');
  }
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

export function extractTriageRoute(text = '') {
  for (const [flow, marker] of Object.entries(TRIAGE_MARKERS)) {
    if (text && text.includes(marker)) return flow;
  }
  return null;
}

export function getFlowStageIndex(flow, messages) {
  if (!flow || !FLOW_STAGES[flow]) {
    return 0;
  }

  const markers = FLOW_MARKERS[flow] || [];
  const guruText = messages
    .filter((message) => message.type === 'guru' && typeof message.text === 'string')
    .map((message) => message.text)
    .join('\n');

  let highest = 0;
  markers.forEach((marker, index) => {
    if (guruText.includes(marker)) {
      highest = Math.max(highest, index + 1);
    }
  });

  return Math.min(highest, FLOW_STAGES[flow].length - 1);
}

export function getFlowStages(flow) {
  return FLOW_STAGES[flow] || [];
}

export function stripJsonFences(text) {
  return String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
}

export function safeJsonParse(text, label = 'response') {
  try {
    return JSON.parse(stripJsonFences(text));
  } catch {
    throw new Error(`Model ${label} was not valid JSON. Ask the model to retry.`);
  }
}

export function confidenceLabelFor(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'Unrated';
  if (score >= 80) return 'Directly supported';
  if (score >= 60) return 'Supported across sources';
  if (score >= 40) return 'Interpretive';
  if (score >= 20) return 'Contested';
  return 'Source missing';
}

export const NINJA_RANK_BANDS = [
  { min: 90, label: 'Master Ninja' },
  { min: 80, label: 'Senior Ninja' },
  { min: 70, label: 'Ninja' },
  { min: 55, label: 'Apprentice' },
  { min: 0, label: 'Initiate' },
];

export function rankForAverage(average) {
  if (typeof average !== 'number' || Number.isNaN(average)) return 'Unranked';
  const band = NINJA_RANK_BANDS.find((entry) => average >= entry.min);
  return band ? band.label : 'Unranked';
}

const FLOW_LABELS = {
  start_project: 'Build a Problem Statement',
  process_review: 'Design Process Critique',
  final_review: 'Final Roast',
};

export function listAllFlows() {
  return Object.keys(FLOW_STAGES);
}

export function collectStageScoresFromThreads(threads, { username } = {}) {
  const rows = [];

  (threads || []).forEach((thread) => {
    if (!thread || !thread.flow) return;
    const stages = FLOW_STAGES[thread.flow] || [];
    const flowLabel = FLOW_LABELS[thread.flow] || thread.flow;

    (thread.messages || [])
      .filter(
        (message) =>
          message.type === 'score_card' && typeof message.stageIndex === 'number'
      )
      .forEach((message) => {
        rows.push({
          flow: thread.flow,
          flowLabel,
          threadId: thread.id,
          threadTitle: thread.title || flowLabel,
          username: thread.username || username || '',
          stageIndex: message.stageIndex,
          stage: stages[message.stageIndex] || `Stage ${message.stageIndex + 1}`,
          score: message.score,
          rationale: message.rationale || '',
          confidence: message.confidence || confidenceLabelFor(message.score),
          strengths: Array.isArray(message.strengths) ? message.strengths : [],
          weaknesses: Array.isArray(message.weaknesses) ? message.weaknesses : [],
          suggestedImprovement: message.suggestedImprovement || '',
        });
      });
  });

  rows.sort((a, b) => {
    if (a.flow === b.flow) return a.stageIndex - b.stageIndex;
    return a.flow.localeCompare(b.flow);
  });

  return rows;
}

export function parsePersonasJson(content) {
  const parsed = safeJsonParse(content, 'personas');

  if (parsed && Array.isArray(parsed.personas)) {
    return parsed.personas;
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  throw new Error('Personas payload was not a list.');
}

function getUserTurnCount(messages) {
  return messages.filter((message) => message.type === 'user').length;
}

export function createChatPayload(thread, historyMessages, userParts) {
  const maxOutputTokens = thread.flow === 'start_project' ? 240 : 220;
  const turnCount = getUserTurnCount(historyMessages) + 1;

  return {
    instructions: getChatInstructions(thread.flow, thread.projectContext, turnCount),
    maxOutputTokens,
    contents: [...getRecentContextHistory(historyMessages), { role: 'user', parts: userParts }],
  };
}

export function createTriagePayload(historyMessages, userParts) {
  return {
    instructions: TRIAGE_INSTRUCTIONS,
    maxOutputTokens: 180,
    contents: [...buildContextHistory(historyMessages), { role: 'user', parts: userParts }],
  };
}

export function createStageScorePayload(thread, stageLabel, stageText) {
  return {
    instructions: getStageScoreInstructions(stageLabel, thread.projectContext),
    maxOutputTokens: 220,
    contents: [
      ...getRecentContextHistory(thread.messages),
      {
        role: 'user',
        parts: [
          {
            text: `Score the following work for the "${stageLabel}" stage. Be honest and direct.\n\n"""\n${stageText}\n"""`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: STAGE_SCORE_SCHEMA,
    },
  };
}

export function createWorkflowPayload(thread) {
  return {
    instructions: getWorkflowInstructions(thread.projectContext),
    maxOutputTokens: 240,
    contents: [
      ...getRecentContextHistory(thread.messages),
      {
        role: 'user',
        parts: [
          {
            text: 'Based on the agreed problem and solution statements, propose a concrete future workflow.',
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: WORKFLOW_SCHEMA,
    },
  };
}

export function createToolPayload(toolType, thread) {
  const isPersonaTool = toolType === 'personas';

  return {
    instructions: getToolInstructions(toolType, thread.flow, thread.projectContext),
    maxOutputTokens: isPersonaTool ? 420 : 220,
    contents: [
      ...getRecentContextHistory(thread.messages),
      {
        role: 'user',
        parts: [
          {
            text: getToolPrompt(toolType),
          },
        ],
      },
    ],
    ...(isPersonaTool
      ? {
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: PERSONAS_SCHEMA,
          },
        }
      : {}),
  };
}

export function generateCertificateHtml({ title, username, date, scores, rank, average }) {
  const groups = {};
  scores.forEach((score) => {
    if (!groups[score.flow]) groups[score.flow] = [];
    groups[score.flow].push(score);
  });

  const groupSections = Object.entries(groups)
    .map(([flow, rows]) => {
      const flowHeading = rows[0]?.flowLabel || flow;
      const rowsHtml = rows
        .map(
          (score) => `
          <tr>
            <td>
              <div class="stage">${score.stage}</div>
              <div class="confidence">${score.confidence}</div>
            </td>
            <td class="score"><strong>${score.score}</strong> <span class="of">/ 100</span></td>
            <td>
              <div class="rationale">${score.rationale || ''}</div>
              ${score.strengths.length ? `<div class="tag-row"><span class="tag tag-cyan">Strengths</span><span class="tag-body">${score.strengths.join(' · ')}</span></div>` : ''}
              ${score.weaknesses.length ? `<div class="tag-row"><span class="tag tag-fuchsia">Weaknesses</span><span class="tag-body">${score.weaknesses.join(' · ')}</span></div>` : ''}
              ${score.suggestedImprovement ? `<div class="improve">Next move: ${score.suggestedImprovement}</div>` : ''}
            </td>
          </tr>`
        )
        .join('');
      return `
        <section class="flow">
          <h2>${flowHeading}</h2>
          <table>
            <thead>
              <tr><th>Stage</th><th>Score</th><th>Critique</th></tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </section>`;
    })
    .join('');

  const avgDisplay = typeof average === 'number' ? average.toFixed(1) : '—';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — dotai Design Ninja Certificate</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;600&family=Source+Serif+4:wght@400;600&display=swap');
    body { margin: 0; font-family: 'IBM Plex Sans', Arial, sans-serif; background: #090909; color: #F7F5F0; }
    .sheet { max-width: 820px; margin: 40px auto; border: 2px solid #F7F5F0; padding: 56px; background: #090909; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00F1DE; padding-bottom: 24px; margin-bottom: 32px; }
    .brand { font-family: 'IBM Plex Mono', monospace; font-size: 13px; text-transform: uppercase; letter-spacing: 0.2em; color: #00F1DE; }
    h1 { font-family: 'IBM Plex Mono', monospace; font-size: 30px; text-transform: uppercase; margin: 12px 0 0; letter-spacing: 0.04em; }
    .rank-stamp { border: 2px solid #FF00A8; padding: 14px 20px; text-align: center; font-family: 'IBM Plex Mono', monospace; text-transform: uppercase; letter-spacing: 0.18em; }
    .rank-stamp .label { font-size: 11px; color: #FF00A8; }
    .rank-stamp .value { font-size: 22px; margin-top: 6px; color: #FF00A8; }
    .rank-stamp .avg { font-size: 12px; color: #C8C5BF; margin-top: 4px; letter-spacing: 0.1em; }
    .meta { margin: 24px 0 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
    .meta div { font-size: 14px; color: #C8C5BF; }
    .meta strong { color: #F7F5F0; font-weight: 600; }
    .flow { margin-top: 28px; }
    .flow h2 { font-family: 'IBM Plex Mono', monospace; font-size: 13px; text-transform: uppercase; letter-spacing: 0.18em; color: #00F1DE; margin: 0 0 12px; border-left: 2px solid #00F1DE; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
    th { text-align: left; text-transform: uppercase; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.12em; color: #00F1DE; border-bottom: 1px solid #6B6965; padding: 10px 8px; }
    td { border-bottom: 1px solid #2a2a2a; padding: 14px 8px; vertical-align: top; color: #EFEDE8; }
    td .stage { font-weight: 600; }
    td .confidence { font-family: 'IBM Plex Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #6B6965; margin-top: 4px; }
    td.score { font-family: 'IBM Plex Mono', monospace; font-size: 16px; white-space: nowrap; }
    td.score strong { color: #FF00A8; font-size: 22px; }
    td.score .of { color: #6B6965; font-size: 11px; }
    td .rationale { line-height: 1.5; margin-bottom: 8px; }
    td .tag-row { display: flex; gap: 8px; align-items: flex-start; margin-top: 6px; font-size: 12px; }
    td .tag { font-family: 'IBM Plex Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; padding: 2px 6px; flex-shrink: 0; }
    .tag-cyan { color: #00F1DE; border: 1px solid #00F1DE; }
    .tag-fuchsia { color: #FF00A8; border: 1px solid #FF00A8; }
    td .tag-body { color: #C8C5BF; line-height: 1.4; }
    td .improve { margin-top: 8px; font-size: 12px; color: #EFEDE8; border-left: 2px solid #FF00A8; padding-left: 8px; font-style: italic; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #2a2a2a; font-size: 12px; color: #6B6965; font-family: 'IBM Plex Mono', monospace; text-align: center; letter-spacing: 0.1em; }
    @media print { body { background: #fff; color: #000; } .sheet { border: 1px solid #000; } td .improve { color: #000; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="brand">dotai · Not a Guru</div>
        <h1>Design Ninja Certificate</h1>
        <div style="margin-top: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #C8C5BF; text-transform: uppercase; letter-spacing: 0.16em;">Prepared for ${username || 'Unnamed'}</div>
      </div>
      <div class="rank-stamp">
        <div class="label">Rank</div>
        <div class="value">${rank || 'Unranked'}</div>
        <div class="avg">Average ${avgDisplay} / 100</div>
      </div>
    </div>
    <div class="meta">
      <div><strong>Practitioner:</strong> ${username || 'Unnamed'}</div>
      <div><strong>Date:</strong> ${date}</div>
      <div><strong>Sessions scored:</strong> ${scores.length} stages across ${Object.keys(groups).length} flow(s)</div>
      <div><strong>Issued by:</strong> dotai · Not a Guru</div>
    </div>
    ${groupSections || '<p>No scored stages yet.</p>'}
    <div class="footer">
      This Design Ninja certificate records stage-by-stage critique scores generated by the Not a Guru assistant.
    </div>
  </div>
</body>
</html>`;
}

export function downloadCertificate({ username, scores, title, rank, average }) {
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const safeTitle = title || 'dotai Design Ninja Certificate';
  const html = generateCertificateHtml({ title: safeTitle, username, date, scores, rank, average });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const nameSlug = (username || 'ninja').replace(/\s+/g, '_').toLowerCase();
  link.download = `${nameSlug}_design_ninja_certificate.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
