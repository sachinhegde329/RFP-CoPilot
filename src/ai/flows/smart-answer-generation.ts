// src/ai/flows/smart-answer-generation.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating draft answers to RFP questions using a knowledge base.
 *
 * - generateDraftAnswer - A function that generates a draft answer to an RFP question.
 * - GenerateDraftAnswerInput - The input type for the generateDraftAnswer function.
 * - GenerateDraftAnswerOutput - The return type for the generateDraftAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDraftAnswerInputSchema = z.object({
  rfpQuestion: z.string().describe('The RFP question to answer.'),
  knowledgeBaseContent: z.string().describe('Relevant content from the knowledge base.'),
  tone: z.string().describe('The desired tone of the answer (e.g., formal, technical, consultative).').optional(),
});
export type GenerateDraftAnswerInput = z.infer<typeof GenerateDraftAnswerInputSchema>;

const GenerateDraftAnswerOutputSchema = z.object({
  draftAnswer: z.string().describe('The generated draft answer to the RFP question.'),
  confidenceScore: z.number().describe('A score indicating the confidence level of the generated answer (0-1).').optional(),
});
export type GenerateDraftAnswerOutput = z.infer<typeof GenerateDraftAnswerOutputSchema>;

export async function generateDraftAnswer(input: GenerateDraftAnswerInput): Promise<GenerateDraftAnswerOutput> {
  return generateDraftAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDraftAnswerPrompt',
  input: {schema: GenerateDraftAnswerInputSchema},
  output: {schema: GenerateDraftAnswerOutputSchema},
  prompt: `You are an expert RFP response generator.

  Based on the following RFP question and relevant knowledge base content, generate a high-quality draft answer.

RFP Question: {{{rfpQuestion}}}

Knowledge Base Content: {{{knowledgeBaseContent}}}

  Tone: {{#if tone}}{{{tone}}}{{else}}Formal{{/if}}

  Draft Answer:`, // No need to specify the output format as it's described in the schema.
});

const generateDraftAnswerFlow = ai.defineFlow(
  {
    name: 'generateDraftAnswerFlow',
    inputSchema: GenerateDraftAnswerInputSchema,
    outputSchema: GenerateDraftAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
