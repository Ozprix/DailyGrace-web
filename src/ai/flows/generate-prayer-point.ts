
'use server';
/**
 * @fileOverview Generates a prayer point based on a Bible verse and message.
 *
 * - generatePrayerPoint - A function that handles the prayer point generation.
 * - GeneratePrayerPointInput - The input type.
 * - GeneratePrayerPointOutput - The return type.
 */
import { z } from 'zod';
import { defineFlow } from '@genkit-ai/core';
import { generate } from '@genkit-ai/ai';
import { gemini10Pro } from '@genkit-ai/googleai';

const GeneratePrayerPointInputSchema = z.object({
  verse: z.string().describe('The daily Bible verse.'),
  message: z.string().describe('The inspirational message based on the verse.'),
  preferShortPrayer: z.boolean().optional().describe('If true, generate a single sentence prayer. Otherwise, generate a 1-3 sentence prayer.'),
});
export type GeneratePrayerPointInput = z.infer<typeof GeneratePrayerPointInputSchema>;

const GeneratePrayerPointOutputSchema = z.object({
  prayerPoint: z.string().describe('A prayer point related to the verse and message. Length depends on preferShortPrayer input.'),
});
export type GeneratePrayerPointOutput = z.infer<typeof GeneratePrayerPointOutputSchema>;

const generatePrayerPointFlow = defineFlow(
  {
    name: 'generatePrayerPointFlow',
    inputSchema: GeneratePrayerPointInputSchema,
    outputSchema: GeneratePrayerPointOutputSchema,
    retry: {
      maxAttempts: 3,
      backoff: {
        initialDelay: 1000,
        maxDelay: 10000,
        multiplier: 2,
      },
    },
  },
  async (input: GeneratePrayerPointInput) => {
    const llmResponse = await generate({
      model: gemini10Pro,
      prompt: {
        text: `You are an AI assistant who is an expert Christian devotional writer.
Your task is to write a short prayer point based on the provided Bible verse and its accompanying message.
Your response MUST be a JSON object with a single key: "prayerPoint".
{{#if preferShortPrayer}}
The prayer point should be a single, concise sentence.
{{else}}
The prayer point should be a short prayer of 1-3 sentences.
{{/if}}

Bible Verse: {{{verse}}}
Message: {{{message}}}`,
        input: input,
      },
      output: {
        schema: GeneratePrayerPointOutputSchema,
      },
    });

    const output = llmResponse.output();
    if (!output || !output.prayerPoint) {
      throw new Error("AI failed to generate a valid prayer point.");
    }
    return output;
  },
  () => {}
);

export async function generatePrayerPoint(input: GeneratePrayerPointInput): Promise<GeneratePrayerPointOutput> {
  return generatePrayerPointFlow.invoke(input);
}
