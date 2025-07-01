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
  prompt: `You are an expert at analyzing and categorizing technical and business documentation. Your task is to generate a list of relevant tags for the provided content chunk.

  The tags should be simple, lowercase keywords that capture the main topics of the text.

  Here are some examples of good tags based on content categories:
  - For ITSM content, use tags like: "incident", "change", "problem", "cmdb", "itil", "service management".
  - For GRC content, use tags like: "policy", "compliance", "risk", "sox", "audit".
  - For Security content, use tags like: "encryption", "iso", "authentication", "firewall", "soc 2".
  - For general business content, use tags like: "pricing", "legal", "sla", "support", "company overview".
  
  Analyze the following content and generate a list of the most relevant tags based on these principles. If no specific tags apply, return an empty array.

  Content to tag:
  {{{content}}}`,
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
