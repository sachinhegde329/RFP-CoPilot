
"use server"

import { autoSummarizeRfp } from "@/ai/flows/auto-summarize-rfp"
import { generateDraftAnswer } from "@/ai/flows/smart-answer-generation"
import { aiExpertReview } from "@/ai/flows/ai-expert-review"
import { extractRfpQuestions } from "@/ai/flows/extract-rfp-questions"
import { parseDocument } from "@/ai/flows/parse-document"
import { ingestWebsiteContent } from "@/ai/flows/ingest-website-content"
import { knowledgeBaseService } from "@/lib/knowledge-base"

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

export async function generateAnswerAction(question: string, tenantId: string) {
  if (!question) {
    return { error: "Question cannot be empty." }
  }
   if (!tenantId) {
    return { error: "Tenant ID is missing." }
  }

  try {
    const relevantChunks = knowledgeBaseService.searchChunks(tenantId, question);
    
    if (relevantChunks.length === 0) {
        return {
            answer: "I could not find any relevant information in the knowledge base to answer this question. Please add more documents or try rewording the question.",
            sources: []
        };
    }

    const result = await generateDraftAnswer({
      rfpQuestion: question,
      knowledgeBaseChunks: relevantChunks.map(chunk => ({
          content: chunk.content,
          source: chunk.sourceName
      })),
      tone: "Formal",
    })
    return { answer: result.draftAnswer, sources: result.sources }
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

export async function parseDocumentAction(documentDataUri: string, tenantId: string, fileName: string) {
    if (!documentDataUri) {
        return { error: "Document data cannot be empty." };
    }
     if (!tenantId || !fileName) {
        return { error: "Missing required parameters for parsing." };
    }
    try {
        const result = await parseDocument({ documentDataUri });
        knowledgeBaseService.addChunks(tenantId, 'document', fileName, result.chunks);
        return { success: true, text: result.text, chunksCount: result.chunks.length };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "Failed to parse document.";
        return { error: errorMessage };
    }
}

export async function ingestWebsiteAction(url: string, tenantId: string) {
    if (!url) {
        return { error: "URL cannot be empty." };
    }
    if (!tenantId) {
        return { error: "Tenant ID is missing." };
    }
    try {
        const result = await ingestWebsiteContent({ url });
        knowledgeBaseService.addChunks(tenantId, 'website', result.url, result.chunks);
        return { success: true, ...result };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "Failed to ingest website.";
        return { error: errorMessage };
    }
}
