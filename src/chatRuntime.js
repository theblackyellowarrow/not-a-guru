import { getChatInstructions, getToolInstructions, getToolPrompt } from './personaPrompt';

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

  if (typeof result.output_text === 'string' && result.output_text.trim()) {
    return result.output_text;
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

export function createChatPayload(thread, historyMessages, userParts) {
  return {
    instructions: getChatInstructions(thread.flow, thread.projectContext),
    maxOutputTokens: thread.flow === 'venting_mode' ? 120 : 180,
    contents: [...getRecentContextHistory(historyMessages), { role: 'user', parts: userParts }],
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
            responseSchema: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  demographic: { type: 'STRING' },
                  needs: { type: 'ARRAY', items: { type: 'STRING' } },
                  frustrations: { type: 'ARRAY', items: { type: 'STRING' } },
                  quote: { type: 'STRING' },
                },
                required: ['name', 'demographic', 'needs', 'frustrations', 'quote'],
              },
            },
          },
        }
      : {}),
  };
}
