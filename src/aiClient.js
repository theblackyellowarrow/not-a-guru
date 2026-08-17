import { parseAIResponse } from './chatRuntime.js';

export const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.1-mini';
export const PROXY_URL = import.meta.env.VITE_OPENAI_PROXY_URL || '/api/openai';
const DEFAULT_TIMEOUT_MS = 25000;

export async function callAI(payload, { stream = false, signal } = {}) {
  const controller = new AbortController();
  const timeoutMs = payload?.__timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort);
  }

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
    if (signal) signal.removeEventListener('abort', onAbort);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${extractErrorMessage(errorText)}`);
  }

  return response;
}

export async function* streamAITokens(payload, options = {}) {
  const response = await callAI(payload, { ...options, stream: true });
  if (!response.body) {
    yield await parseAIResponse(response, { label: options.label || 'stream' });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;

        const token = parseStreamLine(line);
        if (token) yield token;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseStreamLine(line) {
  if (line.startsWith('data:')) {
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') return null;
    try {
      const parsed = JSON.parse(payload);
      const delta = parsed?.choices?.[0]?.delta?.content
        || parsed?.delta?.text
        || parsed?.text
        || '';
      return delta || null;
    } catch {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(line);
    return parsed?.text || parsed?.delta?.text || null;
  } catch {
    return null;
  }
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
