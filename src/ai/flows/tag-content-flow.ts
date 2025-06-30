'use server';

/**
 * @fileOverview A flow to automatically analyze a text chunk and generate relevant tags.
 *
 * - tagContent - A function that handles the content tagging process.
 * - TagContentInput - The input type for the tagContent function.
 * - TagContentOutput - The return type for the tagContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TagContentInputSchema = z.object({
  content: z.string().describe('The text content to be tagged.'),
});
export type TagContentInput = z.infer<typeof TagContentInputSchema>;

const TagContentOutputSchema = z.object({
  tags: z.array(z.string()).describe('A list of relevant tags for the content (e.g., security, pricing, legal, product).'),
});
export type TagContentOutput = z.infer<typeof TagContentOutputSchema>;

export async function tagContent(input: TagContentInput): Promise<TagContentOutput> {
  return tagContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tagContentPrompt',
  input: {schema: TagContentInputSchema},
  output: {schema: TagContentOutputSchema},
  prompt: `You are an expert at analyzing and categorizing text. Your task is to generate a list of relevant tags for the provided content chunk.

  The tags should be simple, lowercase keywords. Consider categories like: security, pricing, legal, product, company, compliance, technical, sla.

  Content to tag:
  {{{content}}}

  Please provide the output as a list of tags. If no specific tags apply, return an empty array.`,
});

const tagContentFlow = ai.defineFlow(
  {
    name: 'tagContentFlow',
    inputSchema: TagContentInputSchema,
    outputSchema: TagContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
