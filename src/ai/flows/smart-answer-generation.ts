
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

const ContextChunkSchema = z.object({
  content: z.string().describe('A chunk of text from a knowledge base document.'),
  source: z.string().describe('The source of the content chunk (e.g., document title, URL).')
});

const GenerateDraftAnswerInputSchema = z.object({
  rfpQuestion: z.string().describe('The RFP question to answer.'),
  knowledgeBaseChunks: z.array(ContextChunkSchema).describe('Relevant chunks of content from the knowledge base.'),
  tone: z.string().describe('The desired tone of the answer (e.g., formal, technical, consultative).').optional(),
});
export type GenerateDraftAnswerInput = z.infer<typeof GenerateDraftAnswerInputSchema>;

const GenerateDraftAnswerOutputSchema = z.object({
  draftAnswer: z.string().describe('The generated draft answer to the RFP question.'),
  confidenceScore: z.number().describe('A score indicating the confidence level of the generated answer (0-1).').optional(),
  sources: z.array(z.string()).describe('A list of sources used to generate the answer.'),
});
export type GenerateDraftAnswerOutput = z.infer<typeof GenerateDraftAnswerOutputSchema>;

export async function generateDraftAnswer(input: GenerateDraftAnswerInput): Promise<GenerateDraftAnswerOutput> {
  return generateDraftAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDraftAnswerPrompt',
  input: {schema: GenerateDraftAnswerInputSchema},
  output: {schema: GenerateDraftAnswerOutputSchema},
  prompt: `You are an expert RFP response generator. Your task is to generate a complete, accurate, and confident response to an RFP question using the provided internal company knowledge.

RFP Question: {{{rfpQuestion}}}

Knowledge Base Context:
{{#each knowledgeBaseChunks}}
- {{{this.content}}} (source: {{{this.source}}})
{{/each}}

Tone: {{#if tone}}{{{tone}}}{{else}}Formal{{/if}}

Based on the context, generate a high-quality draft answer. Cite the relevant sources in parentheses where appropriate in the answer text, for example: (source: Security Policy 2023).
Also, list all the source titles you used in the 'sources' output field.
`,
});

const generateDraftAnswerFlow = ai.defineFlow(
  {
    name: 'generateDraftAnswerFlow',
    inputSchema: GenerateDraftAnswerInputSchema,
    outputSchema: GenerateDraftAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    // Ensure sources are populated in the output, even if the LLM fails to do so.
    // This provides basic traceability.
    if (!output!.sources || output!.sources.length === 0) {
      output!.sources = input.knowledgeBaseChunks.map(chunk => chunk.source);
    }

    return output!;
  }
);
