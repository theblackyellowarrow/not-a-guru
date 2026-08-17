const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
export const MODEL_NAME = env.VITE_OPENAI_MODEL || 'gpt-4.1-mini';
export const PROXY_URL = env.VITE_OPENAI_PROXY_URL || '/api/openai';
