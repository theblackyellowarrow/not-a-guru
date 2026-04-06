const GEMINI_MODEL = 'gemini-2.0-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const PROXY_URL = import.meta.env.VITE_GEMINI_PROXY_URL || '/api/gemini';
const ALLOW_BROWSER_KEY = import.meta.env.VITE_ALLOW_BROWSER_GEMINI === 'true';

function getApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY;
}

export async function callGeminiAPI(payload, { stream = false } = {}) {
  const apiKey = getApiKey();

  const response =
    ALLOW_BROWSER_KEY && apiKey
      ? await callGeminiFromBrowser(payload, { apiKey, stream })
      : await callGeminiViaProxy(payload, { stream });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  return response;
}

async function callGeminiViaProxy(payload, { stream }) {
  return fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload,
      stream,
      model: GEMINI_MODEL,
    }),
  });
}

async function callGeminiFromBrowser(payload, { apiKey, stream }) {
  const mode = stream ? 'streamGenerateContent' : 'generateContent';
  const url = `${API_BASE}/${GEMINI_MODEL}:${mode}?key=${apiKey}`;

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
