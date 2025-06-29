
"use server"

import { autoSummarizeRfp } from "@/ai/flows/auto-summarize-rfp"
import { generateDraftAnswer } from "@/ai/flows/smart-answer-generation"
import { aiExpertReview } from "@/ai/flows/ai-expert-review"
import { extractRfpQuestions } from "@/ai/flows/extract-rfp-questions"
import { parseDocument } from "@/ai/flows/parse-document"
import { knowledgeBaseService } from "@/lib/knowledge-base"
import { getTenantBySubdomain, plansConfig } from "@/lib/tenants"
import { stripe } from "@/lib/stripe"


// This action is used by the main dashboard's RfpSummaryCard
export async function parseDocumentAction(documentDataUri: string, tenantId: string) {
    if (!documentDataUri) {
        return { error: "Document data cannot be empty." };
    }
     if (!tenantId) {
        return { error: "Tenant ID is missing." };
    }

    const tenant = getTenantBySubdomain(tenantId);
    if (!tenant) {
        return { error: "Invalid tenant." };
    }

    const base64Data = documentDataUri.split(',')[1];
    if (!base64Data) {
        return { error: "Invalid document data format." };
    }
    const sizeInBytes = Math.ceil(base64Data.length * 3 / 4);
    const sizeInMb = sizeInBytes / (1024 * 1024);
    
    if (sizeInMb > tenant.limits.fileSizeMb) {
        return { error: `File size of ${sizeInMb.toFixed(2)}MB exceeds the ${tenant.limits.fileSizeMb}MB limit for your plan. Please upgrade or upload a smaller file.` };
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
    const relevantChunks = await knowledgeBaseService.searchChunks(tenantId, question);
    
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
          source: chunk.title
      })),
      tone: "Formal",
    })
    return { answer: result.draftAnswer, sources: result.sources }
  } catch (e) {
    console.error(e)
    return { error: "Failed to generate answer." }
  }
}

export async function reviewAnswerAction(question: string, answer: string, tenantId: string) {
  if (!question || !answer) {
    return { error: "Question and answer cannot be empty." }
  }
  
  const tenant = getTenantBySubdomain(tenantId);
  if (!tenant) {
    return { error: "Tenant not found." };
  }

  if (tenant.plan === 'free') {
    return { error: "AI Expert Review is a premium feature. Please upgrade your plan to use it." };
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
        const sources = knowledgeBaseService.getDataSources(tenantId);
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

    const newSource = knowledgeBaseService.addDataSource({
        tenantId,
        type: 'document',
        name: fileName,
        status: 'Syncing',
        lastSynced: 'In progress...',
        uploader: 'Current User',
        itemCount: 0
    });
    
    // Don't await this, let it run in the background
    (async () => {
        try {
            const parseResult = await parseDocument({ documentDataUri });
            await knowledgeBaseService.addChunks(tenantId, newSource.id, 'document', fileName, parseResult.chunks);
            knowledgeBaseService.updateDataSource(tenantId, newSource.id, {
                status: 'Synced',
                lastSynced: new Date().toLocaleDateString(),
                itemCount: parseResult.chunks.length,
            });
        } catch (error) {
            console.error(`Failed to parse and embed document ${fileName}:`, error);
            knowledgeBaseService.updateDataSource(tenantId, newSource.id, {
                status: 'Error',
                lastSynced: 'Failed to process',
            });
        }
    })();
    
    return { source: newSource };
}

export async function addWebsiteSourceAction(url: string, tenantId: string) {
    if (!url || !tenantId) {
        return { error: "Missing required parameters for adding website." };
    }

    const newSource = knowledgeBaseService.addDataSource({
        tenantId,
        type: 'website',
        name: url,
        status: 'Syncing',
        lastSynced: 'In progress...',
        itemCount: 0
    });

    // Don't await this, let it run in the background
    knowledgeBaseService.syncDataSource(tenantId, newSource.id);

    return { source: newSource };
}


export async function resyncKnowledgeSourceAction(tenantId: string, sourceId: string) {
    if (!tenantId || !sourceId) {
        return { error: "Missing required parameters." };
    }
    
    const source = knowledgeBaseService.getDataSource(tenantId, sourceId);
    if (!source) {
        return { error: "Source not found." };
    }

    // Only website re-sync is supported for now.
    if (source.type !== 'website') {
        return { error: `Re-syncing for '${source.type}' sources is not yet supported.` };
    }

    knowledgeBaseService.updateDataSource(tenantId, sourceId, {
        status: 'Syncing',
        lastSynced: 'In progress...',
    });

    // Don't await this, let it run in the background
    knowledgeBaseService.syncDataSource(tenantId, sourceId);

    return { success: true };
}

export async function deleteKnowledgeSourceAction(tenantId: string, sourceId: string) {
    if (!tenantId || !sourceId) {
        return { error: "Missing required parameters for deleting source." };
    }
    try {
        const success = knowledgeBaseService.deleteDataSource(tenantId, sourceId);
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
        const sources = knowledgeBaseService.getDataSources(tenantId);
        const source = sources.find(s => s.id === sourceId);
        return { source };
    } catch (e) {
        console.error(e);
        return { error: "Failed to check source status." };
    }
}

// == BILLING ACTIONS ==

const STRIPE_PRICE_IDS = {
    // IMPORTANT: Replace these with your actual Price IDs from your Stripe dashboard
    // These prices should be configured in Stripe as "per unit" for per-seat billing.
    starter: 'price_1Pg_SAMPLE_STARTER', 
    growth: 'price_1Pg_SAMPLE_GROWTH',   
};

export async function createCheckoutSessionAction(plan: 'starter' | 'growth', tenantId: string) {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_APP_URL) {
        return { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY and NEXT_PUBLIC_APP_URL." };
    }
    
    const priceId = STRIPE_PRICE_IDS[plan];
    if (!priceId) {
        return { error: "Invalid plan selected." };
    }

    const tenant = getTenantBySubdomain(tenantId);
    if (!tenant) {
        return { error: "Tenant not found." };
    }
    
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.subdomain}?stripe=success`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing?tenant=${tenant.subdomain}`;

    const seats = plansConfig[plan].seats;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: seats,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            // In a real app, you would associate the checkout session with your user/tenant
            // using `client_reference_id` or `metadata`. We use metadata here.
            metadata: {
                tenantId: tenant.id,
                plan: plan,
            },
        });

        if (!session.id) {
            return { error: "Could not create Stripe checkout session." };
        }

        return { sessionId: session.id };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Stripe error: ${errorMessage}` };
    }
}
