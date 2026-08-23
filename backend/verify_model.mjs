/**
 * verify_model.mjs — directly calls gemini-3.5-flash and prints the raw response.
 * If the model name is invalid, the API throws an error that is caught and printed.
 * This distinguishes "model exists, returned a result" from "silently fell back."
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) { console.error('No API key found'); process.exit(1); }

console.log('Testing model: gemini-3.5-flash');
console.log('API key present:', apiKey.slice(0, 6) + '...');
console.log('---');

try {
  const model = new ChatGoogleGenerativeAI({
    modelName: 'gemini-3.5-flash',
    apiKey,
    maxOutputTokens: 64,
  });

  const startMs = Date.now();
  const result = await model.invoke([
    { role: 'user', content: 'Reply with exactly: MODEL_VERIFIED' }
  ]);
  const elapsedMs = Date.now() - startMs;

  console.log('SUCCESS — model responded in', elapsedMs, 'ms');
  console.log('Response content:', result.content);
  console.log('Response type:', typeof result.content);
  console.log('---');
  console.log('VERDICT: gemini-3.5-flash is a valid model. API call returned a real LLM response.');
} catch (err) {
  console.error('FAILURE — model call threw an error:');
  console.error('  Error name:', err.name);
  console.error('  Error message:', err.message);
  if (err.message.includes('not found') || err.message.includes('invalid') || err.message.includes('404')) {
    console.error('VERDICT: Model name is INVALID. The API rejected it.');
    console.error('ACTION REQUIRED: Check the actual model string. Candidates: gemini-1.5-flash, gemini-2.0-flash, gemini-2.5-flash');
  } else {
    console.error('VERDICT: Network/auth error — model validity unclear. Check API key and connectivity.');
  }
  process.exit(1);
}
