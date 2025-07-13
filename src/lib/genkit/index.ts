// src/lib/genkit/index.ts
import 'server-only';

import { genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

/**
 * The configured Genkit AI instance.
 * This is the central object for defining flows, prompts, and models.
 */
export const ai = genkit({
  plugins: [googleAI()],
});
