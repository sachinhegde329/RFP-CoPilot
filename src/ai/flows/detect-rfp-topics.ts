'use server';

/**
 * @fileOverview A flow to analyze RFP text and detect the main topics.
 *
 * - detectRfpTopics - A function that handles the topic detection process.
 * - DetectRfpTopicsInput - The input type for the function.
 * - DetectRfpTopicsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectRfpTopicsInputSchema = z.object({
  documentText: z.string().describe('The full text content of the RFP document.'),
});
export type DetectRfpTopicsInput = z.infer<typeof DetectRfpTopicsInputSchema>;

const DetectRfpTopicsOutputSchema = z.object({
  topics: z.array(z.string()).describe('A list of detected topics relevant to the RFP (e.g., ITSM, GRC, Security, compliance, pricing).'),
});
export type DetectRfpTopicsOutput = z.infer<typeof DetectRfpTopicsOutputSchema>;

export async function detectRfpTopics(input: DetectRfpTopicsInput): Promise<DetectRfpTopicsOutput> {
  return detectRfpTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectRfpTopicsPrompt',
  input: {schema: DetectRfpTopicsInputSchema},
  output: {schema: DetectRfpTopicsOutputSchema},
  prompt: `You are an expert at analyzing Request for Proposals (RFPs). Your task is to identify the main topics or categories covered in the provided RFP text.

  Based on the content, extract a list of relevant topic keywords. Use the following examples as a guide for categorization:
  - For ITSM content, use tags like: "ITSM", "incident", "change", "problem", "CMDB", "ITIL", "service management".
  - For GRC content, use tags like: "GRC", "policy", "compliance", "risk", "SOX", "audit".
  - For Security content, use tags like: "security", "encryption", "ISO", "authentication", "firewall", "SOC 2".
  - For general business content, use tags like: "pricing", "legal", "SLA", "support", "company overview".

  Analyze the following RFP text and generate a list of the most relevant topic keywords.

  RFP Text:
  {{{documentText}}}`,
});

const detectRfpTopicsFlow = ai.defineFlow(
  {
    name: 'detectRfpTopicsFlow',
    inputSchema: DetectRfpTopicsInputSchema,
    outputSchema: DetectRfpTopicsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
