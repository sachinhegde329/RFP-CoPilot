import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set. Please add it to your .env file.");
}

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-2.5-pro',
});
