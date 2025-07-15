'use server';
/**
 * @fileOverview A Genkit flow for interacting with Grace Companion AI.
 *
 * - interactWithGraceCompanion - Main function to call the flow.
 * - GraceCompanionUserInput - Input type for the user's message and context.
 * - GraceCompanionAIOutput - Output type for the AI's response.
 */

import { ai } from '@/ai/genkit';
import { generate } from '@genkit-ai/ai';
import { z } from 'zod';

// Define input/output schemas
const GraceCompanionInputSchema = z.object({
  userMessage: z.string().describe("The user's message to Grace Companion AI."),
  subscriptionStatus: z.enum(['free', 'premium']).optional().default('free').describe("The user's current subscription status."),
});

const GraceCompanionOutputSchema = z.object({
  aiResponseText: z.string().describe("The AI's response to the user's message."),
});

// Type definitions
export type GraceCompanionUserInput = z.infer<typeof GraceCompanionInputSchema>;
export type GraceCompanionAIOutput = z.infer<typeof GraceCompanionOutputSchema>;

// Helper function to build system prompt based on subscription
function buildSystemPrompt(subscriptionStatus: 'free' | 'premium'): string {
  const basePrompt = `You are Grace Companion AI, a kind, empathetic, and knowledgeable spiritual assistant.
Your advice and responses should always be grounded in biblical principles and aim to be encouraging and supportive.

Guidelines:
- If the user asks about a specific Bible verse, provide information from your general knowledge but state that you cannot look up the exact text at this moment
- If the user seems distressed, offer comfort and remind them of God's love and promises
- If the user asks for a devotional message, provide one based on general biblical themes
- Always respond with compassion and wisdom`;

  const subscriptionGuidance = subscriptionStatus === 'free' 
    ? '

Response style: Keep responses concise, typically 1-2 paragraphs. Provide focused, helpful guidance without overly detailed explanations unless specifically requested and essential.'
    : '

Response style: Feel free to provide detailed and in-depth responses. You can offer comprehensive guidance and elaborate on biblical principles as needed.';

  return basePrompt + subscriptionGuidance;
}

const prompt = ai.definePrompt(
  {
    name: 'graceCompanionPrompt',
    input: { schema: GraceCompanionInputSchema },
    output: { schema: GraceCompanionOutputSchema },
    system: (input) => buildSystemPrompt(input.subscriptionStatus),
    prompt: (input) => input.userMessage,
  },
);

const interactWithGraceCompanionFlow = ai.defineFlow(
  {
    name: 'interactWithGraceCompanionFlow',
    inputSchema: GraceCompanionInputSchema,
    outputSchema: GraceCompanionOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output || !output.aiResponseText) {
        return { 
          aiResponseText: "I'm sorry, I couldn't generate a response at this moment. Could you try rephrasing or asking something else? I'm here to help you with spiritual guidance and biblical wisdom." 
        };
      }
      return output;
    } catch (error) {
      console.error('Error in Grace Companion flow:', error);
      return { 
        aiResponseText: "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment. I'm here to support you with spiritual guidance whenever you need it." 
      };
    }
  }
);


export async function interactWithGraceCompanion(
  input: GraceCompanionUserInput
): Promise<GraceCompanionAIOutput> {
  return interactWithGraceCompanionFlow(input);
}
