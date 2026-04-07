import { Readable } from 'node:stream';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

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

  const { payload, stream = false, model = 'gpt-5.4-mini' } = req.body || {};
  if (!payload) {
    res.status(400).json({ error: 'Missing OpenAI payload.' });
    return;
  }

  try {
    const requestBody = {
      model,
      input: translateContentsToResponsesInput(payload.contents || []),
    };

    const textFormat = translateStructuredOutput(payload.generationConfig);
    if (textFormat) {
      requestBody.text = { format: textFormat };
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
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown OpenAI proxy error.',
    });
  }
}

function translateContentsToResponsesInput(contents) {
  return contents.map((message) => ({
    role: translateRole(message.role),
    content: translatePartsToContent(message.parts || []),
  }));
}

function translateRole(role) {
  if (role === 'model') return 'assistant';
  return role || 'user';
}

function translatePartsToContent(parts) {
  return parts.flatMap((part) => {
    if (part.text) {
      return [{ type: 'input_text', text: part.text }];
    }

    if (part.inlineData) {
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
