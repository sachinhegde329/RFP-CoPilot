'use server';

/**
 * @fileOverview A flow to analyze all RFPs in a workspace to generate product and competitive insights.
 *
 * - generateRfpInsights - A function that handles the RFP insights generation process.
 * - RfpInsightsInput - The input type for the function.
 * - RfpInsightsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { rfpService } from '@/lib/rfp.service';
import type { Question } from '@/lib/rfp-types';

const RfpInsightsInputSchema = z.object({
  tenantId: z.string().describe('The ID of the tenant workspace to analyze.'),
});
export type RfpInsightsInput = z.infer<typeof RfpInsightsInputSchema>;

const RfpInsightsOutputSchema = z.object({
  executiveSummary: z.string().describe('A high-level summary of the key findings from the RFP analysis.'),
  recurringThemes: z.array(z.object({ theme: z.string(), count: z.number(), examples: z.array(z.string()) })).describe('A list of the most common themes or topics found in RFP questions, with frequency counts and example questions.'),
  featureGaps: z.array(z.object({ gap: z.string(), examples: z.array(z.string()) })).describe('A list of potential feature gaps or requests identified from the questions.'),
  competitiveMentions: z.array(z.object({ competitor: z.string(), count: z.number() })).describe('A list of competitors mentioned in the RFPs and the frequency of mentions.'),
  commonObjections: z.array(z.object({ objection: z.string(), examples: z.array(z.string()) })).describe('A list of common objections or points of concern raised in the RFPs.'),
});
export type RfpInsightsOutput = z.infer<typeof RfpInsightsOutputSchema>;

export async function generateRfpInsights(input: RfpInsightsInput): Promise<RfpInsightsOutput> {
  return rfpInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rfpInsightsPrompt',
  input: {schema: z.object({ allQuestions: z.array(z.string()) })},
  output: {schema: RfpInsightsOutputSchema},
  prompt: `You are a RevOps and Product Strategy analyst reviewing a collection of questions from multiple Request for Proposals (RFPs). Your goal is to aggregate this data to uncover recurring themes, identify feature gaps, track competitive mentions, and pinpoint common objections.

Analyze the following list of RFP questions and provide a structured analysis.

RFP Questions:
---
{{#each allQuestions}}
- {{{this}}}
{{/each}}
---

Analysis Instructions:
1.  **Executive Summary**: Write a brief, high-level summary of the most critical insights a product manager or RevOps leader should know.
2.  **Recurring Themes**: Identify the top 5-7 most common themes or topics. For each theme, provide a count of how many questions relate to it, and list 1-2 example questions.
3.  **Feature Gaps**: List any questions that suggest a missing feature or a request for functionality that may not exist. Provide example questions.
4.  **Competitive Mentions**: Identify any explicit mentions of competitor companies. Tally the number of times each competitor is mentioned.
5.  **Common Objections**: Extract questions that represent potential customer objections, concerns, or perceived weaknesses (e.g., questions about security vulnerabilities, lack of a certification, pricing concerns). Provide example questions for each objection.

Provide the output in the structured format requested. If a category has no findings, return an empty array for it.`,
});

const rfpInsightsFlow = ai.defineFlow(
  {
    name: 'rfpInsightsFlow',
    inputSchema: RfpInsightsInputSchema,
    outputSchema: RfpInsightsOutputSchema,
  },
  async ({ tenantId }) => {
    const allRfps = await rfpService.getRfps(tenantId);
    
    // We'll use all questions from all RFPs for a comprehensive analysis.
    const allQuestions = allRfps.flatMap(rfp => rfp.questions.map(q => q.question));

    if (allQuestions.length < 5) { // Need a minimum amount of data for meaningful insights
        throw new Error("Not enough RFP data to generate meaningful insights. Please process more RFPs.");
    }

    const {output} = await prompt({ allQuestions });
    
    if (!output) {
      throw new Error("The AI model failed to return structured data for RFP insights.");
    }
    return output;
  }
);
