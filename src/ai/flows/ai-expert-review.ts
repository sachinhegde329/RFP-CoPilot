'use server';

/**
 * @fileOverview This file defines a Genkit flow for AI-powered review of generated answers, simulating a subject matter expert (SME).
 *
 * - aiExpertReview - A function that initiates the AI expert review process.
 * - AiExpertReviewInput - The input type for the aiExpertReview function.
 * - AiExpertReviewOutput - The return type for the aiExpertReview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiExpertReviewInputSchema = z.object({
  question: z.string().describe('The RFP question being answered.'),
  answer: z.string().describe('The generated answer to the RFP question.'),
  context: z.string().optional().describe('Additional context for the question and answer.'),
});
export type AiExpertReviewInput = z.infer<typeof AiExpertReviewInputSchema>;

const AiExpertReviewOutputSchema = z.object({
  review: z.string().describe('The AI expert review of the answer, including suggestions for improvement.'),
  confidenceScore: z.number().describe('A confidence score (0-1) indicating the AI expert review quality.'),
});
export type AiExpertReviewOutput = z.infer<typeof AiExpertReviewOutputSchema>;

export async function aiExpertReview(input: AiExpertReviewInput): Promise<AiExpertReviewOutput> {
  return aiExpertReviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiExpertReviewPrompt',
  input: {schema: AiExpertReviewInputSchema},
  output: {schema: AiExpertReviewOutputSchema},
  prompt: `You are a subject matter expert (SME) reviewing a generated answer to an RFP question. Your goal is to improve the quality and accuracy of the answer.

  RFP Question: {{{question}}}
  Generated Answer: {{{answer}}}
  Context: {{{context}}}

  Provide a detailed review of the answer, including specific suggestions for improvement. Assess the answer's accuracy, completeness, and clarity.  Also provide a confidence score (0-1) indicating the quality of your review. 1 represents the highest confidence and 0 represents the lowest.

  Review:`, 
});

const aiExpertReviewFlow = ai.defineFlow(
  {
    name: 'aiExpertReviewFlow',
    inputSchema: AiExpertReviewInputSchema,
    outputSchema: AiExpertReviewOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
