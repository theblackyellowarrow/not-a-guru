import { callAI } from './aiClient';

export async function callGeminiAPI(payload, options = {}) {
  return callAI(payload, options);
}
