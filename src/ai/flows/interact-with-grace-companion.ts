
'use server';
/**
 * @fileOverview A Genkit flow for interacting with Grace Companion AI.
 *
 * - interactWithGraceCompanion - Main function to call the flow.
 * - GraceCompanionUserInput - Input type for the user's message and context.
 * - GraceCompanionAIOutput - Output type for the AI's response.
 */

import { ai } from '@/lib/genkit';
import { z } from 'zod';
import type { GraceCompanionUserInput, GraceCompanionAIOutput } from '@/types';


const InteractWithGraceCompanionInputSchema = z.object({
  userMessage: z.string().describe("The user's message to Grace Companion AI."),
  subscriptionStatus: z.enum(['free', 'premium']).optional().default('free').describe("The user's current subscription status."),
});

const InteractWithGraceCompanionOutputSchema = z.object({
  aiResponseText: z.string().describe("Grace Companion AI's response to the user."),
});

export async function interactWithGraceCompanion(
  input: GraceCompanionUserInput
): Promise<GraceCompanionAIOutput> {
  return interactWithGraceCompanionFlow(input);
}

const graceCompanionPrompt = ai.definePrompt({
  name: 'graceCompanionPrompt',
  input: { schema: InteractWithGraceCompanionInputSchema },
  output: { schema: InteractWithGraceCompanionOutputSchema },
  system: `You are Grace Companion AI, a kind, empathetic, and knowledgeable spiritual assistant.
Your advice and responses should always be grounded in biblical principles and aim to be encouraging and supportive.

If the user asks about a specific Bible verse, you can provide information about it from your general knowledge, but state that you are currently unable to look up the exact text.

If the user seems distressed, offer comfort and remind them of God's love and promises.
If the user asks for a devotional message, you can provide one based on general biblical themes.

Subscription context: User is on '{{subscriptionStatus}}' plan.
{{#if subscriptionStatus == 'free'}}
(For free users, keep responses concise, typically 1-2 paragraphs. Avoid very long detailed explanations unless specifically asked for and essential.)
{{else}}
(For premium users, feel free to provide more detailed and in-depth responses.)
{{/if}}
`,
  prompt: `User message: {{{userMessage}}}

Grace Companion AI response:`,
});

const interactWithGraceCompanionFlow = ai.defineFlow(
  {
    name: 'interactWithGraceCompanionFlow',
    inputSchema: InteractWithGraceCompanionInputSchema,
    outputSchema: InteractWithGraceCompanionOutputSchema,
    retry: {
      maxAttempts: 3,
      backoff: {
        initialDelay: 1000,
        maxDelay: 10000,
        multiplier: 2,
      },
    },
  },
  async (input: GraceCompanionUserInput) => {
    const logger = ai.log || console;
    logger.info('interactWithGraceCompanionFlow: Started with input:', input);
    try {
      const { output } = await graceCompanionPrompt(input);

      if (!output) {
        logger.error('interactWithGraceCompanionFlow: LLM returned null or undefined output.', { input });
        return { aiResponseText: "I'm sorry, I couldn't generate a response at this moment. Could you try rephrasing or asking something else?" };
      }
      logger.info('interactWithGraceCompanionFlow: Successfully received output from prompt.');
      return output;
    } catch (error: any) {
      logger.error('interactWithGraceCompanionFlow: Error during prompt execution', { input, error: error.message, stack: error.stack });
      return { aiResponseText: "I'm sorry, an unexpected error occurred while I was thinking. Please try your request again in a moment." };
    }
  }
);
