'use server';

/**
 * @fileOverview A flow to automatically summarize the key details of an uploaded RFP.
 *
 * - autoSummarizeRfp - A function that handles the RFP summarization process.
 * - AutoSummarizeRfpInput - The input type for the autoSummarizeRfp function.
 * - AutoSummarizeRfpOutput - The return type for the autoSummarizeRfp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoSummarizeRfpInputSchema = z.object({
  documentText: z.string().describe('The text content of the RFP document.'),
});
export type AutoSummarizeRfpInput = z.infer<typeof AutoSummarizeRfpInputSchema>;

const AutoSummarizeRfpOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the RFP, including scope, deadlines, and requirements.'),
});
export type AutoSummarizeRfpOutput = z.infer<typeof AutoSummarizeRfpOutputSchema>;

export async function autoSummarizeRfp(input: AutoSummarizeRfpInput): Promise<AutoSummarizeRfpOutput> {
  return autoSummarizeRfpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoSummarizeRfpPrompt',
  input: {schema: AutoSummarizeRfpInputSchema},
  output: {schema: AutoSummarizeRfpOutputSchema},
  prompt: `You are an AI assistant specializing in summarizing Request for Proposals (RFPs).

  Given the text content of an RFP, provide a concise summary that includes:
  - The overall scope of the project or services requested.
  - Key deadlines for proposal submission and project milestones.
  - The main requirements and deliverables expected from the responding party.

  RFP Text:
  {{documentText}}`,
});

const autoSummarizeRfpFlow = ai.defineFlow(
  {
    name: 'autoSummarizeRfpFlow',
    inputSchema: AutoSummarizeRfpInputSchema,
    outputSchema: AutoSummarizeRfpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
