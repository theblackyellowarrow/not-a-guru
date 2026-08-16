import {
  FLOW_MARKERS,
  FLOW_STAGES,
  getChatInstructions,
  getScoreInstructions,
  getStageScoreInstructions,
  getToolInstructions,
  getToolPrompt,
  getWorkflowInstructions,
  MARKERS,
  PERSONAS_SCHEMA,
  PROBLEM_SCORE_SCHEMA,
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

  if (!Array.isArray(result.output)) {
    return '';
  }

  return result.output
    .flatMap((item) => item.content || [])
    .map((contentItem) => contentItem.text || contentItem.value || '')
    .join('')
    .trim();
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

export const QUEST_STAGES = FLOW_STAGES.start_project;

export function getQuestStageIndex(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 0;
  }

  const guruText = messages
    .filter((message) => message.type === 'guru' && typeof message.text === 'string')
    .map((message) => message.text)
    .join('\n');

  if (guruText.includes(MARKERS.SOLUTION_STATEMENT_READY)) return 2;
  if (guruText.includes(MARKERS.PROBLEM_STATEMENT_READY)) return 1;
  return 0;
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

export function getCurrentStageLabel(flow, messages) {
  const stages = getFlowStages(flow);
  if (!stages.length) return '';
  return stages[getFlowStageIndex(flow, messages)];
}

export function parsePersonasJson(content) {
  const cleaned = String(content || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  const parsed = JSON.parse(cleaned);

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

export function createScorePayload(thread, problemStatementText) {
  return {
    instructions: getScoreInstructions(thread.projectContext),
    maxOutputTokens: 220,
    contents: [
      ...getRecentContextHistory(thread.messages),
      {
        role: 'user',
        parts: [
          {
            text: `Score the following problem statement. Be honest and direct.\n\n"""\n${problemStatementText}\n"""`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: PROBLEM_SCORE_SCHEMA,
    },
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

export function generateCertificateHtml({ title, username, date, scores }) {
  const scoreRows = scores
    .map(
      (score) => `
      <tr>
        <td>${score.stage}</td>
        <td><strong>${score.score}</strong> / 100</td>
        <td>${score.rationale}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — dotai Marksheet</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;600&display=swap');
    body { margin: 0; font-family: 'IBM Plex Sans', Arial, sans-serif; background: #090909; color: #F7F5F0; }
    .sheet { max-width: 720px; margin: 40px auto; border: 1px solid #F7F5F0; padding: 48px; background: #090909; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #FF00A8; padding-bottom: 24px; margin-bottom: 32px; }
    .brand { font-family: 'IBM Plex Mono', monospace; font-size: 14px; text-transform: uppercase; letter-spacing: 0.2em; color: #FF00A8; }
    h1 { font-family: 'IBM Plex Mono', monospace; font-size: 28px; text-transform: uppercase; margin: 0; letter-spacing: 0.04em; }
    .meta { margin: 24px 0 32px; }
    .meta div { font-size: 14px; color: #C8C5BF; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; text-transform: uppercase; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; color: #FF00A8; border-bottom: 1px solid #6B6965; padding: 12px 8px; }
    td { border-bottom: 1px solid #2a2a2a; padding: 14px 8px; vertical-align: top; color: #EFEDE8; }
    td strong { color: #FF00A8; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #2a2a2a; font-size: 12px; color: #6B6965; font-family: 'IBM Plex Mono', monospace; text-align: center; }
    @media print { body { background: #fff; color: #000; } .sheet { border: 1px solid #000; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="brand">dotai · Not a Guru</div>
        <h1>${title}</h1>
      </div>
    </div>
    <div class="meta">
      <div><strong>Practitioner:</strong> ${username || 'Unnamed'}</div>
      <div><strong>Date:</strong> ${date}</div>
    </div>
    <table>
      <thead>
        <tr><th>Stage</th><th>Score</th><th>Rationale</th></tr>
      </thead>
      <tbody>
        ${scoreRows}
      </tbody>
    </table>
    <div class="footer">
      This marksheet records stage-by-stage critique scores generated by the Not a Guru assistant.
    </div>
  </div>
</body>
</html>`;
}

export function downloadCertificate({ title, username, scores }) {
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const html = generateCertificateHtml({ title, username, date, scores });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(title || 'marksheet').replace(/\s+/g, '_').toLowerCase()}_marksheet.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
