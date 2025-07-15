
'use server';
/**
 * @fileOverview Generates an inspirational message and themes based on a Bible verse.
 *
 * - generateDevotionalMessage - A function that handles the message generation.
 * - GenerateDevotionalMessageInput - The input type.
 * - GenerateDevotionalMessageOutput - The return type.
 */
import { z } from 'zod';
import { defineFlow } from '@genkit-ai/core';
import { generate } from '@genkit-ai/ai';
import { gemini10Pro } from '@genkit-ai/googleai';

const GenerateDevotionalMessageInputSchema = z.object({
  bibleVerse: z.string().describe('The full text of the Bible verse for the devotional.'),
  preferShortMessage: z.boolean().optional().describe('If true, generate a short, single-sentence message. Otherwise, generate 1-2 paragraphs.'),
});
export type GenerateDevotionalMessageInput = z.infer<typeof GenerateDevotionalMessageInputSchema>;

const GenerateDevotionalMessageOutputSchema = z.object({
  message: z.string().describe('The inspirational devotional message.'),
  themes: z.array(z.string()).describe('A list of 2-3 relevant themes derived from the verse and message.'),
});
export type GenerateDevotionalMessageOutput = z.infer<typeof GenerateDevotionalMessageOutputSchema>;

const generateDevotionalMessageFlow = defineFlow(
  {
    name: 'generateDevotionalMessageFlow',
    inputSchema: GenerateDevotionalMessageInputSchema,
    outputSchema: GenerateDevotionalMessageOutputSchema,
  },
  async (input: GenerateDevotionalMessageInput) => {
    const llmResponse = await generate({
      model: gemini10Pro,
      prompt: {
        text: `You are an AI assistant and Christian devotional writer. Your task is to write an uplifting message and extract 2-3 relevant themes based on the provided Bible verse.

Bible Verse: {{{bibleVerse}}}

{{#if preferShortMessage}}
Write a short, single-sentence devotional message.
{{else}}
Write 1-2 uplifting paragraphs for the devotional message.
{{/if}}

Based on the verse and your generated message, provide an array of 2-3 relevant themes (e.g., "faith", "hope", "love", "strength").
Your response MUST be a valid JSON object.`,
        input: input,
      },
      output: {
        schema: GenerateDevotionalMessageOutputSchema,
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error('AI failed to generate a valid devotional message.');
    }
    return output;
  },
  () => {}
);

export async function generateDevotionalMessage(
  input: GenerateDevotionalMessageInput
): Promise<GenerateDevotionalMessageOutput> {
  return generateDevotionalMessageFlow.invoke(input);
}
