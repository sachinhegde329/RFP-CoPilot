'use server';
/**
 * @fileOverview A general-purpose AI flow to answer questions using the knowledge base.
 *
 * - askAi - A function that handles the question answering process.
 * - AskAiInput - The input type for the askAi function.
 * - AskAiOutput - The return type for the askAi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { knowledgeBaseService } from '@/lib/knowledge-base';

const AskAiInputSchema = z.object({
  query: z.string().describe('The user\'s question.'),
  tenantId: z.string().describe('The ID of the tenant to scope the search.'),
});
export type AskAiInput = z.infer<typeof AskAiInputSchema>;

const AskAiOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer.'),
  sources: z.array(z.string()).describe('A list of knowledge base sources used to generate the answer.'),
});
export type AskAiOutput = z.infer<typeof AskAiOutputSchema>;

export async function askAi(input: AskAiInput): Promise<AskAiOutput> {
  return askAiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askAiPrompt',
  input: {schema: z.object({
      query: z.string(),
      contextChunks: z.array(z.object({
          content: z.string(),
          source: z.string(),
      })),
  })},
  output: {schema: AskAiOutputSchema},
  prompt: `You are a helpful AI assistant for RFP CoPilot. Your task is to answer the user's question based *only* on the provided context from the knowledge base.

  Context from Knowledge Base:
  {{#each contextChunks}}
  - {{{this.content}}} (source: {{{this.source}}})
  {{/each}}
  ---
  Question: {{{query}}}
  ---
  Instructions:
  1.  Generate a comprehensive and accurate answer based on the provided context.
  2.  If the context does not contain enough information, state that you cannot provide an answer based on the available knowledge.
  3.  Cite the sources you used in parentheses in your answer, like this: (source: Document Name).
  4.  In the output, list all the \`sources\` you used.
  `,
});

const askAiFlow = ai.defineFlow(
  {
    name: 'askAiFlow',
    inputSchema: AskAiInputSchema,
    outputSchema: AskAiOutputSchema,
  },
  async ({ query, tenantId }) => {
    const relevantChunks = await knowledgeBaseService.searchChunks(tenantId, query, { topK: 5 });

    if (relevantChunks.length === 0) {
        return {
            answer: "I couldn't find any relevant information in your knowledge base to answer that question.",
            sources: [],
        };
    }

    const contextChunks = relevantChunks.map(chunk => ({
        content: chunk.content,
        source: chunk.metadata.url || chunk.title,
    }));
    
    const {output} = await prompt({query, contextChunks});
    
    if (!output) {
      return {
        answer: "I was unable to generate a response. Please try again.",
        sources: [],
      }
    }
    return output;
  }
);
