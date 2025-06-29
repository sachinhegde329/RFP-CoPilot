
"use server"

import { autoSummarizeRfp } from "@/ai/flows/auto-summarize-rfp"
import { generateDraftAnswer } from "@/ai/flows/smart-answer-generation"
import { aiExpertReview } from "@/ai/flows/ai-expert-review"
import { extractRfpQuestions } from "@/ai/flows/extract-rfp-questions"
import { parseDocument } from "@/ai/flows/parse-document"
import { ingestWebsiteContent } from "@/ai/flows/ingest-website-content"
import { knowledgeBaseService } from "@/lib/knowledge-base"


// This action is used by the main dashboard's RfpSummaryCard
export async function parseDocumentAction(documentDataUri: string) {
    if (!documentDataUri) {
        return { error: "Document data cannot be empty." };
    }
    try {
        const result = await parseDocument({ documentDataUri });
        return { success: true, text: result.text };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "Failed to parse document.";
        return { error: errorMessage };
    }
}

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

// == KNOWLEDGE BASE ACTIONS ==

export async function getKnowledgeSourcesAction(tenantId: string) {
    if (!tenantId) {
        return { error: "Tenant ID is missing." };
    }
    try {
        const sources = knowledgeBaseService.getSources(tenantId);
        return { sources };
    } catch (e) {
        console.error(e);
        return { error: "Failed to retrieve knowledge sources." };
    }
}

export async function addDocumentSourceAction(documentDataUri: string, tenantId: string, fileName: string) {
    if (!documentDataUri || !tenantId || !fileName) {
        return { error: "Missing required parameters for adding document." };
    }

    const newSource = knowledgeBaseService.addSource({
        tenantId,
        type: 'document',
        name: fileName,
        status: 'Syncing',
        lastSynced: 'In progress...',
        uploader: 'Current User',
        itemCount: 0
    });
    
    // Don't await this, let it run in the background
    parseDocument({ documentDataUri }).then(parseResult => {
        knowledgeBaseService.addChunks(tenantId, newSource.id, 'document', fileName, parseResult.chunks);
        knowledgeBaseService.updateSource(tenantId, newSource.id, {
            status: 'Synced',
            lastSynced: new Date().toLocaleDateString(),
            itemCount: parseResult.chunks.length,
        });
    }).catch(error => {
        console.error(`Failed to parse document ${fileName}:`, error);
        knowledgeBaseService.updateSource(tenantId, newSource.id, {
            status: 'Error',
            lastSynced: 'Failed to parse',
        });
    });
    
    return { source: newSource };
}

export async function addWebsiteSourceAction(url: string, tenantId: string) {
    if (!url || !tenantId) {
        return { error: "Missing required parameters for adding website." };
    }

    const newSource = knowledgeBaseService.addSource({
        tenantId,
        type: 'website',
        name: url,
        status: 'Syncing',
        lastSynced: 'In progress...',
        itemCount: 0
    });

    // Don't await this, let it run in the background
    ingestWebsiteContent({ url }).then(ingestResult => {
        knowledgeBaseService.addChunks(tenantId, newSource.id, 'website', ingestResult.url, ingestResult.chunks);
        knowledgeBaseService.updateSource(tenantId, newSource.id, {
            status: 'Synced',
            lastSynced: 'Just now',
            itemCount: ingestResult.chunks.length,
            name: ingestResult.title || url,
        });
    }).catch(error => {
        console.error(`Failed to ingest website ${url}:`, error);
        knowledgeBaseService.updateSource(tenantId, newSource.id, {
            status: 'Error',
            lastSynced: 'Failed to sync',
        });
    });

    return { source: newSource };
}

export async function deleteKnowledgeSourceAction(tenantId: string, sourceId: string) {
    if (!tenantId || !sourceId) {
        return { error: "Missing required parameters for deleting source." };
    }
    try {
        const success = knowledgeBaseService.deleteSource(tenantId, sourceId);
        if (!success) {
            return { error: "Source not found or could not be deleted." };
        }
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to delete source." };
    }
}

export async function checkSourceStatusAction(tenantId: string, sourceId: string) {
    if (!tenantId || !sourceId) {
        return { error: "Missing parameters" };
    }
    try {
        const sources = knowledgeBaseService.getSources(tenantId);
        const source = sources.find(s => s.id === sourceId);
        return { source };
    } catch (e) {
        console.error(e);
        return { error: "Failed to check source status." };
    }
}
