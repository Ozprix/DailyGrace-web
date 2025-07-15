// src/ai/flows/generate-challenge-day-content.genkit.ts
'use server';

import { defineFlow } from '@genkit-ai/core';
import { generate } from '@genkit-ai/ai';
import { z } from 'zod';
import { gemini10Pro } from '@genkit-ai/googleai';

// Define the input schema for the flow
export const GenerateChallengeDayContentInputSchema = z.object({
  challengeDayTitle: z.string().describe('The title of the challenge day (e.g., "Day 1: Focus on Gratitude").'),
  challengeDayBasePrompt: z.string().describe('The original static prompt for the challenge day, providing context or instructions.'),
  bibleVerseText: z.string().optional().describe('The text of the Bible verse associated with this challenge day, if any.'),
  originalPrayerFocus: z.string().optional().describe('The original static prayer focus for the challenge day, if any.'),
  preferShortContent: z.boolean().optional().describe('If true, generate single sentences. Otherwise, generate 1-2 paragraphs for reflection and a 1-3 sentence prayer.'),
});
export type GenerateChallengeDayContentInput = z.infer<typeof GenerateChallengeDayContentInputSchema>;

// Define the output schema for the flow
export const GenerateChallengeDayContentOutputSchema = z.object({
  reflection: z.string().describe("An inspirational reflection related to the challenge day's theme, prompt, and verse. Length depends on preferShortContent."),
  prayerPoint: z.string().describe("A prayer point related to the day's theme. Length depends on preferShortContent."),
});
export type GenerateChallengeDayContentOutput = z.infer<typeof GenerateChallengeDayContentOutputSchema>;

const generateChallengeDayContentFlow = defineFlow(
  {
    name: 'generateChallengeDayContentFlow',
    inputSchema: GenerateChallengeDayContentInputSchema,
    outputSchema: GenerateChallengeDayContentOutputSchema,
  },
  async (input: GenerateChallengeDayContentInput) => {
    const llmResponse = await generate({
      model: gemini10Pro,
      prompt: {
        text: `You are an AI assistant who is an expert and encouraging Christian devotional writer.
Your task is to generate content for a specific day in a spiritual challenge, based on the provided context.
Your response MUST be a JSON object with two keys: "reflection" and "prayerPoint".

Context for the challenge day:
- Title: "{{challengeDayTitle}}"
- Guiding Prompt: "{{challengeDayBasePrompt}}"
{{#if bibleVerseText}}- Associated Bible Verse: "{{bibleVerseText}}"{{/if}}
{{#if originalPrayerFocus}}- Original Prayer Focus: "{{originalPrayerFocus}}"{{/if}}

Instructions:
- For the "reflection" field: {{#if preferShortContent}}Provide a single, concise, inspirational sentence.{{else}}Provide a 1-2 paragraph inspirational reflection that expands on the context.{{/if}}
- For the "prayerPoint" field: {{#if preferShortContent}}Provide a single, concise prayer point sentence.{{else}}Provide a short prayer (1-3 sentences) aligned with the day's theme.{{/if}}`,
        input: input,
      },
      output: {
        schema: GenerateChallengeDayContentOutputSchema,
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error("AI failed to generate a valid challenge day content.");
    }
    return output;
  },
  () => {}
);

export async function generateChallengeDayContent(
  input: GenerateChallengeDayContentInput
): Promise<GenerateChallengeDayContentOutput> {
  return generateChallengeDayContentFlow.invoke(input);
}
