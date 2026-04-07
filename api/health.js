const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const basePayload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  if (req.query?.check !== '1') {
    res.status(200).json(basePayload);
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ ...basePayload, status: 'error', error: 'Missing OPENAI_API_KEY on the server.' });
    return;
  }

  const controller = new AbortController();
  const timeoutMs = 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const upstream = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_HEALTH_MODEL || 'gpt-4.1-mini',
        input: [{ role: 'user', content: [{ type: 'input_text', text: 'ping' }] }],
        max_output_tokens: 16,
        text: { format: { type: 'text' } },
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      res.status(502).json({ ...basePayload, status: 'error', error: errorText });
      return;
    }

    res.status(200).json({
      ...basePayload,
      upstream: 'ok',
      durationMs: Date.now() - start,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      res.status(504).json({ ...basePayload, status: 'error', error: `Timeout after ${timeoutMs / 1000}s.` });
      return;
    }

    res.status(500).json({
      ...basePayload,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown health check error.',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
