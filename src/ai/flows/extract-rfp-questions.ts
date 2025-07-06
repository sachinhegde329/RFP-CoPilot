'use server';

/**
 * @fileOverview A flow to extract and categorize questions from an RFP document.
 *
 * - extractRfpQuestions - A function that handles the question extraction process.
 * - ExtractRfpQuestionsInput - The input type for the extractRfpQuestions function.
 * - ExtractRfpQuestionsOutput - The return type for the extractRfpQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractRfpQuestionsInputSchema = z.object({
  documentText: z.string().describe('The text content of the RFP document.'),
});
export type ExtractRfpQuestionsInput = z.infer<typeof ExtractRfpQuestionsInputSchema>;

const QuestionSchema = z.object({
    id: z.number().describe("A unique sequential number for the question, starting from 1."),
    question: z.string().describe("The full text of the extracted question."),
    category: z.string().describe("The category of the question (e.g., Product, Legal, Security, Pricing, Company)."),
});

const ExtractRfpQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe("A list of all questions found in the RFP document."),
});
export type ExtractRfpQuestionsOutput = z.infer<typeof ExtractRfpQuestionsOutputSchema>;


export async function extractRfpQuestions(input: ExtractRfpQuestionsInput): Promise<ExtractRfpQuestionsOutput> {
  return extractRfpQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractRfpQuestionsPrompt',
  input: {schema: ExtractRfpQuestionsInputSchema},
  output: {schema: ExtractRfpQuestionsOutputSchema},
  prompt: `You are an expert at parsing Request for Proposals (RFPs). Your task is to extract all the individual questions from the provided RFP text.

  For each question you find, you must:
  1. Assign it a unique sequential ID number.
  2. Extract the full question text accurately.
  3. Classify the question into one of the following categories: Product, Legal, Security, Pricing, or Company. If a question doesn't fit, choose the most relevant category.

  RFP Text:
  {{{documentText}}}
  
  Please provide the output as a structured list of questions.`,
});

const extractRfpQuestionsFlow = ai.defineFlow(
  {
    name: 'extractRfpQuestionsFlow',
    inputSchema: ExtractRfpQuestionsInputSchema,
    outputSchema: ExtractRfpQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      console.error("The AI model failed to return structured data for question extraction.");
      // Return a valid, empty response to prevent crashing.
      return { questions: [] };
    }
    return output;
  }
);
