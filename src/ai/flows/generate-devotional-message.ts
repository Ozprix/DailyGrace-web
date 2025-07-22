// // src/ai/flows/generate-devotional-message.ts
// /**
//  * @fileoverview Defines a Genkit flow for generating a devotional message based on a Bible verse.
//  *
//  * This file exports a Zod schema for the flow's input and the flow function itself.
//  * The flow uses a predefined prompt to instruct the AI model on how to generate the devotional content.
//  */
// 'use server';

// import { z } from 'zod';
// import { ai } from '@/ai/genkit';

// const GenerateDevotionalMessageInputSchema = z.object({
//   bibleVerse: z.string().describe('The full text of the Bible verse for the devotional.'),
//   bibleVerseReference: z.string().describe('The reference for the Bible verse (e.g., "John 3:16").'),
//   theme: z.string().optional().describe('An optional theme to guide the devotional message.'),
//   preferShortContent: z.boolean().optional().describe('If true, generate a single, concise inspirational sentence. Otherwise, generate a 1-2 paragraph reflection.'),
// });

// const GenerateDevotionalMessageOutputSchema = z.object({
//   reflection: z.string().describe("An inspirational reflection based on the verse. Length depends on preferShortContent."),
// });

// const prompt = ai.definePrompt({
//   name: 'generateDevotionalMessagePrompt',
//   input: { schema: GenerateDevotionalMessageInputSchema },
//   output: { schema: GenerateDevotionalMessageOutputSchema },
//   prompt: `You are an AI assistant who is an expert and encouraging Christian devotional writer.
// Your task is to write a devotional message based on a Bible verse.

// Context:
// - Bible Verse: "{{bibleVerse}}" ({{bibleVerseReference}})
// {{#if theme}}- Theme: "{{theme}}"{{/if}}

// Instructions:
// - Write a devotional reflection that is encouraging, insightful, and easy to understand.
// - {{#if preferShortContent}}Provide a single, concise, inspirational sentence.{{else}}Provide a 1-2 paragraph reflection.{{/if}}
// - Do not start with "In today's verse" or similar phrases.
// - Your response should only contain the reflection itself, in the "reflection" field.`,
// });

// export const generateDevotionalMessage = ai.defineFlow(
//   {
//     name: 'generateDevotionalMessageFlow',
//     inputSchema: GenerateDevotionalMessageInputSchema,
//     outputSchema: GenerateDevotionalMessageOutputSchema,
//   },
//   async (input) => {
//     const { output } = await prompt(input);
//     if (!output) {
//       throw new Error('AI failed to generate a devotional message.');
//     }
//     return output;
//   }
// );
