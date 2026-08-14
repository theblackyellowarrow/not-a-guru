import { Readable } from 'node:stream';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
// Server-side guardrails: reject oversized payloads before they reach OpenAI,
// and truncate individual text parts so a huge extracted document cannot blow
// past the model context window.
const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024;
const MAX_TEXT_PART_CHARS = 60000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing OPENAI_API_KEY on the server.' });
    return;
  }

  const { payload, stream = false, model = 'gpt-4.1-mini' } = req.body || {};
  if (!payload) {
    res.status(400).json({ error: 'Missing OpenAI payload.' });
    return;
  }

  if (JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) {
    res.status(413).json({
      error: 'Request too large. Keep total message and attachments under about 4 MB.',
    });
    return;
  }

  const controller = new AbortController();
  const timeoutMs = 20000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestBody = {
      model,
      input: translateContentsToResponsesInput(payload.contents || []),
      max_output_tokens: payload.maxOutputTokens || 220,
    };

    if (payload.instructions) {
      requestBody.instructions = payload.instructions;
    }

    const textFormat = translateStructuredOutput(payload.generationConfig);
    if (textFormat) {
      requestBody.text = {
        format: textFormat,
      };
    }

    if (stream) {
      requestBody.stream = true;
    }

    const upstream = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      res.status(upstream.status).send(errorText);
      return;
    }

    if (stream) {
      if (!upstream.body) {
        res.status(502).json({ error: 'OpenAI returned no response body.' });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      Readable.fromWeb(upstream.body).pipe(res);
      return;
    }

    const responseJson = await upstream.json();
    res.status(200).json(responseJson);
  } catch (error) {
    if (error?.name === 'AbortError') {
      res.status(504).json({ error: `OpenAI request timed out after ${timeoutMs / 1000}s.` });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown OpenAI proxy error.',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function translateContentsToResponsesInput(contents) {
  return contents.map((message) => ({
    role: translateRole(message.role),
    content: translatePartsToContent(truncateTextParts(message.parts || []), translateRole(message.role)),
  }));
}

function truncateTextParts(parts) {
  return parts.map((part) => {
    if (typeof part.text === 'string' && part.text.length > MAX_TEXT_PART_CHARS) {
      return {
        ...part,
        text: `${part.text.slice(0, MAX_TEXT_PART_CHARS)}\n\n[Attachment truncated: original exceeded ${MAX_TEXT_PART_CHARS} characters. Split long documents and resend if the missing section matters.]`,
      };
    }
    return part;
  });
}

function translateRole(role) {
  if (role === 'model') return 'assistant';
  return role || 'user';
}

function translatePartsToContent(parts, role) {
  const textType = role === 'assistant' ? 'output_text' : 'input_text';

  return parts.flatMap((part) => {
    if (part.text) {
      return [{ type: textType, text: part.text }];
    }

    if (part.inlineData) {
      if (role === 'assistant') {
        return [];
      }

      const { mimeType, data } = part.inlineData;
      if (mimeType?.startsWith('image/')) {
        return [
          {
            type: 'input_image',
            image_url: `data:${mimeType};base64,${data}`,
          },
        ];
      }
    }

    return [];
  });
}

function translateStructuredOutput(generationConfig) {
  const schema = generationConfig?.responseSchema;
  if (!schema) {
    return null;
  }

  return {
    type: 'json_schema',
    name: 'structured_response',
    strict: true,
    schema: translateSchemaNode(schema),
  };
}

function translateSchemaNode(node) {
  if (!node || typeof node !== 'object') {
    return node;
  }

  const translated = {};

  if (node.type) {
    translated.type = String(node.type).toLowerCase();
  }

  if (node.properties) {
    translated.properties = Object.fromEntries(
      Object.entries(node.properties).map(([key, value]) => [key, translateSchemaNode(value)])
    );

    if (translated.type === 'object') {
      translated.additionalProperties = false;
    }
  }

  if (Array.isArray(node.required)) {
    translated.required = [...node.required];
  }

  if (node.items) {
    translated.items = translateSchemaNode(node.items);
  }

  if (Array.isArray(node.enum)) {
    translated.enum = [...node.enum];
  }

  if (node.description) {
    translated.description = node.description;
  }

  return translated;
}
