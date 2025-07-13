// src/ai/actions/generate-challenge-day-content.action.ts
'use server';
import { runFlow } from '@genkit-ai/flow';
import {
  generateChallengeDayContentFlow,
  type GenerateChallengeDayContentInput,
  type GenerateChallengeDayContentOutput,
} from '../flows/generate-challenge-day-content.genkit';

/**
 * Server action to generate content for a challenge day.
 * This is a wrapper around the Genkit flow.
 */
export async function generateChallengeDayContent(
  input: GenerateChallengeDayContentInput
): Promise<GenerateChallengeDayContentOutput> {
  // The 'runFlow' function executes the Genkit flow
  const result = await runFlow(generateChallengeDayContentFlow, input);
  return result;
}
