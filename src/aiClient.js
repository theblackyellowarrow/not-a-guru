const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.1-mini';
const PROXY_URL = import.meta.env.VITE_OPENAI_PROXY_URL || '/api/openai';

export async function callAI(payload, { stream = false } = {}) {
  const controller = new AbortController();
  const timeoutMs = 25000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload,
        stream,
        model: OPENAI_MODEL,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`OpenAI request timed out after ${timeoutMs / 1000}s.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

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
