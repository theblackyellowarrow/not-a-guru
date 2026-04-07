const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.1-mini';
const PROXY_URL = import.meta.env.VITE_OPENAI_PROXY_URL || '/api/openai';

export async function callAI(payload, { stream = false } = {}) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload,
      stream,
      model: OPENAI_MODEL,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${extractErrorMessage(errorText)}`);
  }

  return response;
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
