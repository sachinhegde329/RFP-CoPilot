"use server"

import { autoSummarizeRfp } from "@/ai/flows/auto-summarize-rfp"
import { generateDraftAnswer } from "@/ai/flows/smart-answer-generation"
import { aiExpertReview } from "@/ai/flows/ai-expert-review"
import { extractRfpQuestions } from "@/ai/flows/extract-rfp-questions"
import { parseDocument } from "@/ai/flows/parse-document"

export async function summarizeRfpAction(rfpText: string) {
  if (!rfpText) {
    return { error: "RFP text cannot be empty." }
  }
  try {
    const result = await autoSummarizeRfp({ documentText: rfpText })
    return { summary: result.summary }
  } catch (e) {
    console.error(e)
    return { error: "Failed to summarize RFP." }
  }
}

export async function generateAnswerAction(question: string, context: string) {
  if (!question) {
    return { error: "Question cannot be empty." }
  }
  try {
    const result = await generateDraftAnswer({
      rfpQuestion: question,
      knowledgeBaseContent: context,
      tone: "Formal",
    })
    return { answer: result.draftAnswer }
  } catch (e) {
    console.error(e)
    return { error: "Failed to generate answer." }
  }
}

export async function reviewAnswerAction(question: string, answer: string) {
  if (!question || !answer) {
    return { error: "Question and answer cannot be empty." }
  }
  try {
    const result = await aiExpertReview({
      question,
      answer,
    })
    return { review: result.review }
  } catch (e) {
    console.error(e)
    return { error: "Failed to get AI review." }
  }
}

export async function extractQuestionsAction(rfpText: string) {
  if (!rfpText) {
    return { error: "RFP text cannot be empty." }
  }
  try {
    const result = await extractRfpQuestions({ documentText: rfpText })
    // Add a default 'pending' compliance status to each question for the UI
    const questionsWithStatus = result.questions.map(q => ({
      ...q,
      compliance: "pending" as const,
    }))
    return { questions: questionsWithStatus }
  } catch (e) {
    console.error(e)
    return { error: "Failed to extract questions from RFP." }
  }
}

export async function parseDocumentAction(documentDataUri: string) {
    if (!documentDataUri) {
        return { error: "Document data cannot be empty." };
    }
    try {
        const result = await parseDocument({ documentDataUri });
        return { success: true, text: result.text, chunksCount: result.chunks.length };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "Failed to parse document.";
        return { error: errorMessage };
    }
}
