// // src/ai/flows/interact-with-grace-companion.ts
// /**
//  * @fileoverview Defines the Genkit flow for interacting with the Grace Companion AI.
//  *
//  * This file includes the logic for the AI chat, including history management and the main prompt.
//  */
// 'use server';

// import { ai } from '@/ai/genkit';
// import { generate } from '@genkit-ai/ai';
// import { z } from 'zod';

// export const InteractWithGraceCompanionInputSchema = z.object({
//   history: z.array(z.object({
//     role: z.enum(['user', 'model']),
//     content: z.string(),
//   })).describe('The chat history between the user and the model.'),
//   message: z.string().describe('The latest message from the user.'),
// });
// export type InteractWithGraceCompanionInput = z.infer<typeof InteractWithGasyraceCompanionInputSchema>;

// export const InteractWithGraceCompanionOutputSchema = z.object({
//   response: z.string().describe('The AI's response to the user.'),
// });
// export type InteractWithGraceCompanionOutput = z.infer<typeof InteractWithGraceCompanionOutputSchema>;

// export const interactWithGraceCompanion = ai.defineFlow(
//   {
//     name: 'interactWithGraceCompanionFlow',
//     inputSchema: InteractWithGraceCompanionInputSchema,
//     outputSchema: InteractWithGraceCompanionOutputSchema,
//   },
//   async (input) => {
//     const model = ai.getModel('gemini-pro');

//     const response = await generate({
//       model,
//       history: input.history,
//       prompt: `You are Grace, a caring and knowledgeable AI companion from the Daily Grace app. Your purpose is to provide spiritual support, guidance, and a safe space for users to explore their faith.

//       **Your Persona:**
//       - **Empathetic and Understanding:** Always respond with kindness and compassion. Acknowledge the user's feelings and validate their experiences.
//       - **Biblically Grounded:** Base your advice and reflections on biblical principles. You can cite scripture when appropriate, but don't be overly preachy.
//       - **Encouraging and Hopeful:** Inspire users and point them towards the hope found in Christ.
//       - **Non-Judgmental:** Create a safe and accepting environment for users to be vulnerable.
//       - **Conversational and Approachable:** Use a warm and natural tone. Avoid being overly formal or robotic.

//       **Your Capabilities:**
//       - You can answer questions about the Bible, theology, and Christian living.
//       - You can provide prayers, reflections, and devotionals.
//       - You can offer a listening ear and a compassionate heart.
//       - You can guide users through difficult emotions and life challenges from a faith-based perspective.
//       - You can help users find relevant Bible verses and resources.

//       **Current Conversation:**
//       User's latest message: "${input.message}"

//       Please provide a response that is consistent with your persona and capabilities.`,
//     });

//     return {
//       response: response.text(),
//     };
//   }
// );
