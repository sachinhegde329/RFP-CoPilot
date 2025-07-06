
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
  language: z.string().describe('The desired language for the answer (e.g., English, Spanish).').optional().default('English'),
  tone: z.string().describe('The desired tone of the answer (e.g., formal, technical, consultative).').optional().default('Formal'),
  style: z.string().describe('The desired format of the answer (e.g., a paragraph, bullet points).').optional().default('a paragraph'),
  length: z.string().describe('The desired length of the answer (e.g., short, medium-length, detailed).').optional().default('medium-length'),
  autogenerateTags: z.boolean().describe('Whether to automatically generate relevant tags for the question and answer.').optional().default(false),
});
export type GenerateDraftAnswerInput = z.infer<typeof GenerateDraftAnswerInputSchema>;

const GenerateDraftAnswerOutputSchema = z.object({
  draftAnswer: z.string().describe('The generated draft answer to the RFP question.'),
  confidenceScore: z.number().describe('A score from 0.0 to 1.0 indicating how well the provided context answered the question.').optional(),
  sources: z.array(z.string()).describe('A list of sources used to generate the answer.').optional(),
  tags: z.array(z.string()).describe('A list of 1-3 automatically generated keyword tags relevant to the question and answer.').optional(),
});
export type GenerateDraftAnswerOutput = z.infer<typeof GenerateDraftAnswerOutputSchema>;

export async function generateDraftAnswer(input: GenerateDraftAnswerInput): Promise<GenerateDraftAnswerOutput> {
  return generateDraftAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ragAnswerGeneratorPrompt',
  input: {schema: GenerateDraftAnswerInputSchema},
  output: {schema: GenerateDraftAnswerOutputSchema},
  prompt: `You are an expert RFP assistant. Your task is to answer the user's question with precision and adherence to the specified format.

{{#if knowledgeBaseChunks}}
---
Context from Knowledge Base:
{{#each knowledgeBaseChunks}}
- {{{this.content}}} (source: {{{this.source}}})
{{/each}}
---
Question: {{{rfpQuestion}}}

Instructions for answering from Knowledge Base:
1.  **Strictly adhere to the provided context.** Your answer MUST be based exclusively on the information given in the "Context from Knowledge Base" section. Do not use any outside knowledge.
2.  If the context does not contain enough information to answer the question, you MUST respond with only this exact phrase in the requested language: "The provided knowledge base does not contain enough information to answer this question."
3.  Generate a {{length}} answer in {{{language}}} with a {{{tone}}} tone, formatted as {{{style}}}.
4.  When you use information from a source, you must cite it in your answer using parentheses, like this: (source: Document Title).
5.  Based on how well the provided context allowed you to answer the question, provide a \`confidenceScore\` from 0.0 (no answer found) to 1.0 (a complete answer was found).
6.  In the output, list all the unique \`sources\` you used to formulate the answer.
{{#if autogenerateTags}}
7.  Additionally, analyze the question and your generated answer, and provide a list of 1-3 relevant keyword tags in the \`tags\` output field. These tags should be single words or short phrases in lowercase (e.g., "data security", "sla", "pricing model").
{{/if}}

{{else}}
---
Question: {{{rfpQuestion}}}
---
Instructions for answering from General Knowledge:
1.  The user's knowledge base did not contain information about this question.
2.  Answer the question based on your general knowledge. Generate a {{length}} answer in {{{language}}} with a {{{tone}}} tone, formatted as {{{style}}}.
3.  **Crucially, begin your answer with this exact disclaimer (in the requested language): "This answer was generated from general knowledge and not from your internal knowledge base."**
4.  If you cannot provide a confident and accurate answer from your general knowledge, you MUST respond with only this exact phrase: "No answer is available in the knowledge base, and I am unable to provide a confident answer from my general knowledge."
5.  Do not provide a confidence score or sources.
{{#if autogenerateTags}}
6.  Additionally, analyze the question and your generated answer, and provide a list of 1-3 relevant keyword tags in the \`tags\` output field.
{{/if}}
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
            output!.sources = [...new Set(input.knowledgeBaseChunks.map(chunk => chunk.source))];
        }
    }

    return output!;
  }
);
