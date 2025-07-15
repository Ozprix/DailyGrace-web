// src/ai/genkit.ts
import { genkit, type Genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit and export the AI instance
export const ai: Genkit = genkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
