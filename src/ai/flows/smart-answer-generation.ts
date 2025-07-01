
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating draft answers to RFP questions.
 * It can use a knowledge base if context is provided, or fall back to general LLM knowledge.
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
  knowledgeBaseChunks: z.array(ContextChunkSchema).describe('Relevant chunks of content from the knowledge base.').optional(),
  tone: z.string().describe('The desired tone of the answer (e.g., formal, technical, consultative).').optional(),
});
export type GenerateDraftAnswerInput = z.infer<typeof GenerateDraftAnswerInputSchema>;

const GenerateDraftAnswerOutputSchema = z.object({
  draftAnswer: z.string().describe('The generated draft answer to the RFP question.'),
  confidenceScore: z.number().describe('A score from 0.0 to 1.0 indicating how well the provided context answered the question.').optional(),
  sources: z.array(z.string()).describe('A list of sources used to generate the answer.').optional(),
});
export type GenerateDraftAnswerOutput = z.infer<typeof GenerateDraftAnswerOutputSchema>;

export async function generateDraftAnswer(input: GenerateDraftAnswerInput): Promise<GenerateDraftAnswerOutput> {
  return generateDraftAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ragAnswerGeneratorPrompt',
  input: {schema: GenerateDraftAnswerInputSchema},
  output: {schema: GenerateDraftAnswerOutputSchema},
  prompt: `You are an expert RFP assistant. Your task is to answer the user's question.

{{#if knowledgeBaseChunks}}
---
Context from Knowledge Base:
{{#each knowledgeBaseChunks}}
- {{{this.content}}} (source: {{{this.source}}})
{{/each}}
---
Question: {{{rfpQuestion}}}

Instructions for answering from Knowledge Base:
1. Based **only** on the context provided, generate a comprehensive and accurate answer in a {{#if tone}}{{{tone}}}{{else}}Formal{{/if}} tone.
2. If the context does not contain enough information to answer the question, state that you cannot provide an answer based on the available knowledge.
3. In your generated answer, cite the sources you used in parentheses, like this: (source: Security Policy 2023).
4. In the output, provide a \`confidenceScore\` from 0.0 to 1.0, representing how well the context answered the question.
5. In the output, list all the \`sources\` you used to formulate the answer.
{{else}}
---
Question: {{{rfpQuestion}}}
---
Instructions for answering from General Knowledge:
1. The user's knowledge base did not contain information about this question.
2. Answer the question based on your general knowledge in a {{#if tone}}{{{tone}}}{{else}}Formal{{/if}} tone.
3. **Crucially, begin your answer with the disclaimer: "This answer was generated from general knowledge and not from your internal knowledge base."**
4. If you cannot provide a confident and accurate answer from your general knowledge, you MUST respond with only this exact phrase: "No answer is available in the knowledge base, and I am unable to provide a confident answer from my general knowledge."
5. Do not provide a confidence score or sources.
{{/if}}
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
    
    // If chunks were provided, ensure sources are populated in the output, even if the LLM fails to do so.
    if (input.knowledgeBaseChunks && input.knowledgeBaseChunks.length > 0) {
        if (!output!.sources || output!.sources.length === 0) {
            output!.sources = input.knowledgeBaseChunks.map(chunk => chunk.source);
        }
    }

    return output!;
  }
);
