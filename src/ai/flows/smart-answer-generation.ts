
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating draft answers to RFP questions using a knowledge base.
 * This implements the final "generation" step of a Retrieval-Augmented Generation (RAG) pipeline.
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
  confidenceScore: z.number().describe('A score from 0.0 to 1.0 indicating how well the provided context answered the question.').optional(),
  sources: z.array(z.string()).describe('A list of sources used to generate the answer.'),
});
export type GenerateDraftAnswerOutput = z.infer<typeof GenerateDraftAnswerOutputSchema>;

export async function generateDraftAnswer(input: GenerateDraftAnswerInput): Promise<GenerateDraftAnswerOutput> {
  return generateDraftAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ragAnswerGeneratorPrompt',
  input: {schema: GenerateDraftAnswerInputSchema},
  output: {schema: GenerateDraftAnswerOutputSchema},
  prompt: `You are an expert RFP assistant. Your task is to use the provided context to answer the user's question.

---
Context:
{{#each knowledgeBaseChunks}}
- {{{this.content}}} (source: {{{this.source}}})
{{/each}}
---
Question: {{{rfpQuestion}}}

Instructions:
1. Based **only** on the context provided, generate a comprehensive and accurate answer in a {{#if tone}}{{{tone}}}{{else}}Formal{{/if}} tone.
2. If the context does not contain enough information to answer the question, state that you cannot provide an answer based on the available knowledge.
3. In your generated answer, cite the sources you used in parentheses, like this: (source: Security Policy 2023).
4. In the output, provide a \`confidenceScore\` from 0.0 to 1.0, representing how well the context answered the question.
5. In the output, list all the \`sources\` you used to formulate the answer.
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
