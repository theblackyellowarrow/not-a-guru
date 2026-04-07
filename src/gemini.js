const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5.4-mini';
const PROXY_URL = import.meta.env.VITE_OPENAI_PROXY_URL || '/api/openai';

export async function callGeminiAPI(payload, { stream = false } = {}) {
  const response = await callOpenAIViaProxy(payload, { stream });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${extractErrorMessage(errorText)}`);
  }

  return response;
}

async function callOpenAIViaProxy(payload, { stream }) {
  return fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload,
      stream,
      model: OPENAI_MODEL,
    }),
  });
}

function extractErrorMessage(errorText) {
  try {
    const parsed = JSON.parse(errorText);

    if (Array.isArray(parsed)) {
      return parsed[0]?.error?.message || errorText;
    }

    return parsed?.error?.message || parsed?.message || errorText;
  } catch {
    return errorText;
  }
}
