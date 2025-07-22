// // src/ai/flows/generate-prayer-point.ts
// /**
//  * @fileoverview Defines a Genkit flow for generating a prayer point based on a Bible verse.
//  *
//  * This file exports a Zod schema for the flow's input and the flow function itself.
//  * The flow uses a predefined prompt to instruct the AI model on how to generate the prayer content.
//  */
// 'use server';

// import { z } from 'zod';
// import { ai } from '@/ai/genkit';

// const GeneratePrayerPointInputSchema = z.object({
//   verse: z.string().describe('The daily Bible verse.'),
//   preferShortContent: z.boolean().optional().describe('If true, generate a single, concise prayer point. Otherwise, generate a 1-3 sentence prayer.'),
// });

// const GeneratePrayerPointOutputSchema = z.object({
//   prayerPoint: z.string().describe('A prayer point inspired by the Bible verse. Length depends on preferShortContent.'),
// });

// const prompt = ai.definePrompt({
//   name: 'generatePrayerPointPrompt',
//   input: { schema: GeneratePrayerPointInputSchema },
//   output: { schema: GeneratePrayerPointOutputSchema },
//   prompt: `You are an AI assistant who is an expert and encouraging Christian devotional writer.
// Your task is to write a prayer point based on a Bible verse.

// Context:
// - Bible Verse: "{{verse}}"

// Instructions:
// - Write a prayer point that is relevant to the verse and encourages the user to pray.
// - {{#if preferShortContent}}Provide a single, concise prayer point sentence.{{else}}Provide a short prayer (1-3 sentences).{{/if}}
// - Do not start with "Let's pray" or similar phrases.
// - Your response should only contain the prayer point itself, in the "prayerPoint" field.`,
// });

// export const generatePrayerPoint = ai.defineFlow(
//   {
//     name: 'generatePrayerPointFlow',
//     inputSchema: GeneratePrayerPointInputSchema,
//     outputSchema: GeneratePrayerPointOutputSchema,
//   },
//   async (input) => {
//     const { output } = await prompt(input);
//     if (!output) {
//       throw new Error('AI failed to generate a prayer point.');
//     }
//     return output;
//   }
// );
