// src/lib/genkit/index.ts
import 'server-only';

import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

// Configure Genkit with the Google AI plugin
configureGenkit({
  plugins: [
    googleAI(),
  ],
  // Log all traces to the console
  logLevel: 'debug',
  // Enable trace collection and metrics
  enableTracingAndMetrics: true,
});
