import {
  getChatInstructions,
  getScoreInstructions,
  getToolInstructions,
  getToolPrompt,
  getWorkflowInstructions,
  MARKERS,
  PERSONAS_SCHEMA,
  PROBLEM_SCORE_SCHEMA,
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

export function stripMarkers(text = '') {
  return text
    .replace(new RegExp(`^\\s*${escapeRegex(MARKERS.PROBLEM_STATEMENT_READY)}\\s*$`, 'gim'), '')
    .replace(new RegExp(`^\\s*${escapeRegex(MARKERS.SOLUTION_STATEMENT_READY)}\\s*$`, 'gim'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const QUEST_STAGES = ['Raw Idea', 'Problem Statement', 'Solution'];

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

export function createChatPayload(thread, historyMessages, userParts) {
  const maxOutputTokens = thread.flow === 'start_project' ? 240 : 220;

  return {
    instructions: getChatInstructions(thread.flow, thread.projectContext),
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
