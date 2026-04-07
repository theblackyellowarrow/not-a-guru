import { Readable } from 'node:stream';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing GEMINI_API_KEY on the server.' });
    return;
  }

  const { payload, stream = false, model = 'gemini-2.0-flash' } = req.body || {};
  if (!payload) {
    res.status(400).json({ error: 'Missing Gemini payload.' });
    return;
  }

  try {
    const mode = stream ? 'streamGenerateContent' : 'generateContent';
    const query = stream ? `alt=sse&key=${apiKey}` : `key=${apiKey}`;
    const upstream = await fetch(`${API_BASE}/${model}:${mode}?${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      res.status(upstream.status).send(errorText);
      return;
    }

    if (!stream) {
      const data = await upstream.text();
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(data);
      return;
    }

    if (!upstream.body) {
      res.status(502).json({ error: 'Gemini returned no response body.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown Gemini proxy error.',
    });
  }
}
