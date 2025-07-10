
"use server"

import { generateDraftAnswer } from "@/ai/flows/smart-answer-generation"
import { aiExpertReview } from "@/ai/flows/ai-expert-review"
import { extractRfpQuestions } from "@/ai/flows/extract-rfp-questions"
import { parseDocument } from "@/ai/flows/parse-document"
import { knowledgeBaseService, type DataSource, type DataSourceType } from "@/lib/knowledge-base"
import { rfpService } from "@/lib/rfp.service"
import type { Question, RFP, RfpStatus } from "@/lib/rfp-types"
import { getTenantBySubdomain, updateTenant } from "@/lib/tenants"
import { type Role, type TeamMember, type Tenant, plansConfig } from "@/lib/tenant-types"
import { stripe } from "@/lib/stripe"
import { hasFeatureAccess, canPerformAction, type Action } from "@/lib/access-control"
import { notificationService } from "@/lib/notifications.service"
import { exportService } from "@/lib/export.service"
import { templateService, type Template, type TemplateSection } from "@/lib/template.service"
import { detectRfpTopics } from "@/ai/flows/detect-rfp-topics"
import { askAi } from "@/ai/flows/ask-ai-flow"
import { answerLibraryService, type QnAPair } from "@/lib/answer-library.service"
<<<<<<< HEAD
import { generateRfpInsights, type RfpInsightsOutput } from "@/ai/flows/rfp-insights-flow"
=======
import { getSession } from '@auth0/nextjs-auth0';
>>>>>>> 5954e458f850ba2b59f99429a3df305982b426b5

import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, PageBreak } from 'docx';
import PDFDocument from 'pdfkit';
import * as xlsx from 'xlsx';

// With Auth0, we get the current user from the session on the server.
async function getCurrentUserFromSession(): Promise<TeamMember | null> {
    const session = await getSession();
    if (!session || !session.user) return null;
    
    // In our simplified model, the first user is always the owner.
    // A real implementation would look up the role from a database based on session.user.sub and the tenantId.
    return {
        id: session.user.sub,
        name: session.user.name || session.user.email,
        email: session.user.email,
        role: 'Owner',
        avatar: session.user.picture,
        status: 'Active',
    };
}


// Helper function to check permissions before executing an action
async function checkPermission(tenantId: string, action: Action): Promise<{ tenant: Tenant, user: TeamMember, error?: undefined } | { error: string }> {
    const session = await getSession();
    const userFromSession = session?.user;

    if (!userFromSession) return { error: "Authentication required." };
    
    // The tenant ID is now the user's sub in the simplified model
    if (tenantId !== 'megacorp' && tenantId !== userFromSession.sub) {
        return { error: "Permission denied. You do not have access to this workspace." };
    }
    
    const tenant = await getTenantBySubdomain(tenantId);
    if (!tenant) return { error: "Tenant not found." };
    
    // The getTenantBySubdomain function places the current user as the first member.
    const user = tenant.members.find(m => m.id === userFromSession.sub); 
    if (!user) return { error: "Permission denied. User not a member of this workspace." };
    
    if (!canPerformAction(user.role, action)) {
        return { error: "You do not have permission to perform this action." };
    }
    
    return { tenant, user };
}

// This action is used by the main dashboard's RfpSummaryCard
export async function parseDocumentAction(documentDataUri: string, tenantId: string) {
    const permCheck = await checkPermission(tenantId, 'uploadRfps');
    if (permCheck.error) return { error: permCheck.error };
    const { tenant } = permCheck;

    if (!documentDataUri) {
        return { error: "Document data cannot be empty." };
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

export async function generateAnswerAction(payload: {
    question: string;
    rfpId: string;
    tenantId: string;
    language?: string;
    tone?: string;
    style?: string;
    length?: string;
    autogenerateTags?: boolean;
}) {
  const { question, rfpId, tenantId, language, tone, style, length, autogenerateTags } = payload;
  
  const permCheck = await checkPermission(tenantId, 'editContent');
  if (permCheck.error) return { error: permCheck.error };
  const { tenant } = permCheck;

  // Note: In a real production app, you would check and decrement the tenant's
  // remaining AI answers count from a database here. For this prototype, we'll
  // assume the user has available answers if they are on a valid plan.
  if (tenant.limits.aiAnswers <= 0) {
      return { error: "You have no AI answers remaining this month. Please upgrade your plan or purchase an AI Answer Pack." };
  }

  const rfp = await rfpService.getRfp(tenant.id, rfpId);
  if (!rfp) {
      return { error: "RFP not found." };
  }

  if (!question) {
    return { error: "Question cannot be empty." }
  }

  // Step 1: Check Answer Library for an exact match
  const libraryMatch = await answerLibraryService.findByQuestion(tenant.id, question);
  if (libraryMatch) {
    await answerLibraryService.incrementUsage(tenant.id, libraryMatch.id);
    return {
      answer: libraryMatch.answer,
      sources: [`Answer Library (ID: ${libraryMatch.id})`], // Indicate source is the library
      confidenceScore: 1.0, // Perfect confidence from library
      tags: libraryMatch.tags,
      fromLibrary: true,
    }
  }
  
  // Step 2: If no match, proceed to RAG
  try {
    const relevantChunks = await knowledgeBaseService.searchChunks(tenant.id, question, {
        topK: 5,
        sourceTypes: ['document', 'website'],
        tags: rfp.topics
    });
    
    const result = await generateDraftAnswer({
      rfpQuestion: question,
      knowledgeBaseChunks: relevantChunks.length > 0 ? relevantChunks.map(chunk => ({
          content: chunk.content,
          source: chunk.metadata.url || chunk.title
      })) : undefined,
      language: language || 'English',
      tone: tone || tenant.defaultTone || 'Formal',
      style: style || 'a paragraph',
      length: length || 'medium-length',
      autogenerateTags: autogenerateTags,
    })
    return { answer: result.draftAnswer, sources: result.sources, confidenceScore: result.confidenceScore, tags: result.tags, fromLibrary: false }
  } catch (e) {
    console.error(e)
    return { error: "Failed to generate answer." }
  }
}

export async function reviewAnswerAction(question: string, answer: string, tenantId: string) {
  const permCheck = await checkPermission(tenantId, 'editContent');
  if (permCheck.error) return { error: permCheck.error };
  const { tenant } = permCheck;
  
  if (!question || !answer) {
    return { error: "Question and answer cannot be empty." }
  }
  
  if (!hasFeatureAccess(tenant, 'aiExpertReview')) {
    return { error: "AI Expert Review is not available on your plan. Please upgrade to a Business or Enterprise plan to use this feature." };
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

export async function extractQuestionsAction(rfpText: string, rfpName: string, tenantId: string): Promise<{ rfp?: RFP, error?: string }> {
  const permCheck = await checkPermission(tenantId, 'editWorkspace');
    if (permCheck.error) return { error: permCheck.error };
  const { tenant, user } = permCheck;

  if (!rfpText) {
    return { error: "RFP text cannot be empty." }
  }

  const existingRfps = await rfpService.getRfps(tenant.id);
  if (existingRfps.length >= tenant.limits.rfps) {
      return { error: `You have reached the limit of ${tenant.limits.rfps} active RFPs for your plan. Please upgrade to create more.` };
  }

  try {
    const [questionResult, topicResult] = await Promise.all([
        extractRfpQuestions({ documentText: rfpText }),
        detectRfpTopics({ documentText: rfpText })
    ]);
    
    const questionsWithStatus = questionResult.questions.map(q => ({
      ...q,
      answer: "",
      compliance: "pending" as const,
      assignee: user,
      status: "In Progress" as const,
    }));
    
    const newRfp = await rfpService.addRfp(tenant.id, rfpName, questionsWithStatus, topicResult.topics);
    return { rfp: newRfp }
  } catch (e) {
    console.error(e)
    return { error: "Failed to extract questions from RFP." }
  }
}

export async function updateQuestionAction(tenantId: string, rfpId: string, questionId: number, updates: Partial<Question>) {
    const permCheck = await checkPermission(tenantId, 'editContent');
    if (permCheck.error) return { error: permCheck.error };
    const { user } = permCheck;
    
    if (!questionId) {
        return { error: "Missing question ID." };
    }
    
    if (updates.assignee !== undefined) {
        if (!canPerformAction(user.role, 'assignQuestions')) {
            return { error: "You do not have permission to assign questions." };
        }
    }

    try {
        const updatedQuestion = await rfpService.updateQuestion(tenantId, rfpId, questionId, updates);
        if (!updatedQuestion) {
            return { error: "Question not found or could not be updated." };
        }
        
        // If question is marked as completed, save to answer library
        if (updates.status === 'Completed' && updatedQuestion.answer) {
             await saveToLibraryAction({
                tenantId: tenantId,
                question: updatedQuestion.question,
                answer: updatedQuestion.answer,
                category: updatedQuestion.category,
                tags: updatedQuestion.tags || [],
            });
        }
        
        return { success: true, question: updatedQuestion };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to update question: ${errorMessage}` };
    }
}

export async function addQuestionAction(tenantId: string, rfpId: string, questionData: Omit<Question, 'id'>) {
    const permCheck = await checkPermission(tenantId, 'editContent');
    if (permCheck.error) return { error: permCheck.error };

    if (!questionData) {
        return { error: "Missing required parameters." };
    }
    try {
        const newQuestion = await rfpService.addQuestion(tenantId, rfpId, questionData);
        return { success: true, question: newQuestion };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to add question: ${errorMessage}` };
    }
}

export async function getRfpsAction(tenantId: string): Promise<{ rfps?: RFP[] }> {
    try {
        const rfps = await rfpService.getRfps(tenantId);
        // Sanitize data at the action boundary to ensure it's serializable
        return { rfps: JSON.parse(JSON.stringify(rfps || [])) };
    } catch (e) {
        console.error(e);
        return { rfps: [] };
    }
}

export async function updateRfpStatusAction(tenantId: string, rfpId: string, status: RfpStatus) {
    const permCheck = await checkPermission(tenantId, 'editContent');
    if (permCheck.error) return { error: permCheck.error };
    
    try {
        const updatedRfp = await rfpService.updateRfpStatus(tenantId, rfpId, status);
        if (!updatedRfp) {
            return { error: "RFP not found or could not be updated." };
        }
        return { success: true, rfp: updatedRfp };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to update RFP status: ${errorMessage}` };
    }
}


// == KNOWLEDGE BASE ACTIONS ==

export async function getKnowledgeSourcesAction(tenantId: string) {
    if (!tenantId) {
        return { error: "Tenant ID is missing." };
    }
    try {
        const sources = await knowledgeBaseService.getDataSources(tenantId);
        return { sources };
    } catch (e) {
        console.error(e);
        return { error: "Failed to retrieve knowledge sources." };
    }
}

export async function addDocumentSourceAction(documentDataUri: string, tenantId: string, fileName: string) {
    const permCheck = await checkPermission(tenantId, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };
    const { user } = permCheck;

    if (!documentDataUri || !fileName) {
        return { error: "Missing required parameters for adding document." };
    }

    const newSource = await knowledgeBaseService.addDataSource({
        tenantId: tenantId,
        type: 'document',
        name: fileName,
        status: 'Syncing',
        lastSynced: 'In progress...',
        uploader: user.name,
        itemCount: 0
    });
    
    (async () => {
        try {
            const parseResult = await parseDocument({ documentDataUri });
            await knowledgeBaseService.addChunks(tenantId, newSource.id, 'document', fileName, parseResult.chunks);
            await knowledgeBaseService.updateDataSource(tenantId, newSource.id, {
                status: 'Synced',
                lastSynced: new Date().toLocaleDateString(),
                itemCount: parseResult.chunks.length,
            });
        } catch (error) {
            console.error(`Failed to parse and embed document ${fileName}:`, error);
            await knowledgeBaseService.updateDataSource(tenantId, newSource.id, {
                status: 'Error',
                lastSynced: 'Failed to process',
            });
        }
    })();
    
    return { source: newSource };
}

export async function addWebsiteSourceAction(tenantId: string, config: { url: string; maxDepth: number, maxPages: number, scopePath?: string, excludePaths?: string[], filterKeywords?: string[] }) {
    const permCheck = await checkPermission(tenantId, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!config.url) {
        return { error: "Missing required parameters for adding website." };
    }

    const newSource = await knowledgeBaseService.addDataSource({
        tenantId: tenantId,
        type: 'website',
        name: new URL(config.url).hostname,
        status: 'Syncing',
        lastSynced: 'In progress...',
        itemCount: 0,
        config: config,
    });

    knowledgeBaseService.syncDataSource(tenantId, newSource.id);

    return { source: newSource };
}

<<<<<<< HEAD
export async function addGitHubSourceAction(tenantId: string, currentUser: CurrentUser, data: { repo: string; token: string }) {
    const permCheck = await checkPermission(tenantId, currentUser, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!data.repo || !data.token) {
=======
// Helper for API-based source connections
async function addApiBasedSourceAction(
    tenantId: string,
    type: DataSourceType,
    name: string,
    config: { url: string; apiKey: string;[key: string]: any },
    auth: { apiKey: string;[key: string]: any }
) {
    const permCheck = await checkPermission(tenantId, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!config.url || !config.apiKey) {
        return { error: `Missing required connection details for ${name}.` };
    }

    const hostname = new URL(config.url).hostname;

    const newSource = await knowledgeBaseService.addDataSource({
        tenantId,
        type,
        name: `${name} (${hostname})`,
        status: 'Syncing',
        lastSynced: 'In progress...',
        itemCount: 0,
        config: { url: config.url },
        auth,
    });

    // Don't await this, let it run in the background
    knowledgeBaseService.syncDataSource(tenantId, newSource.id);

    return { source: newSource };
}


export async function addGitHubSourceAction(tenantId: string, config: { repo: string; token: string }) {
    const permCheck = await checkPermission(tenantId, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!config.repo || !config.token) {
>>>>>>> 5954e458f850ba2b59f99429a3df305982b426b5
        return { error: "Missing required GitHub connection details." };
    }

    const newSource = await knowledgeBaseService.addDataSource({
        tenantId,
        type: 'github',
        name: `GitHub (${data.repo})`,
        status: 'Syncing',
        lastSynced: 'In progress...',
        itemCount: 0,
        config: { url: data.repo },
        auth: { apiKey: data.token }
    });

    knowledgeBaseService.syncDataSource(tenantId, newSource.id);
    return { source: newSource };
}

<<<<<<< HEAD
export async function addConfluenceSourceAction(tenantId: string, currentUser: CurrentUser, data: { url: string; username: string; apiKey: string }) {
    const permCheck = await checkPermission(tenantId, currentUser, 'manageIntegrations');
=======
export async function addConfluenceSourceAction(tenantId: string, config: { url: string; username: string; apiKey: string }) {
    return addApiBasedSourceAction(tenantId, 'confluence', 'Confluence', config, {
        username: config.username,
        apiKey: config.apiKey,
    });
}

export async function addNotionSourceAction(tenantId: string, config: { apiKey: string }) {
    const permCheck = await checkPermission(tenantId, 'manageIntegrations');
>>>>>>> 5954e458f850ba2b59f99429a3df305982b426b5
    if (permCheck.error) return { error: permCheck.error };

    if (!data.url || !data.username || !data.apiKey) {
        return { error: "Missing required Confluence connection details." };
    }

    const hostname = new URL(data.url).hostname;
    const newSource = await knowledgeBaseService.addDataSource({
        tenantId,
        type: 'confluence',
        name: `Confluence (${hostname})`,
        status: 'Syncing',
        lastSynced: 'In progress...',
        itemCount: 0,
        config: { url: data.url },
        auth: { username: data.username, apiKey: data.apiKey },
    });
    
    knowledgeBaseService.syncDataSource(tenantId, newSource.id);
    return { source: newSource };
}

export async function addNotionSourceAction(tenantId: string, currentUser: CurrentUser, data: { apiKey: string }) {
    const permCheck = await checkPermission(tenantId, currentUser, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!data.apiKey) {
        return { error: "Missing required Notion connection details (API Key)." };
    }

    const newSource = await knowledgeBaseService.addDataSource({
        tenantId,
        type: 'notion',
        name: `Notion Workspace`,
        status: 'Syncing',
        lastSynced: 'In progress...',
        itemCount: 0,
        auth: { apiKey: data.apiKey }
    });

    knowledgeBaseService.syncDataSource(tenantId, newSource.id);
    return { source: newSource };
}

<<<<<<< HEAD

// Generic helper for the remaining simple API key sources
async function addSimpleApiSourceAction(tenantId: string, currentUser: CurrentUser, type: DataSourceType, name: string, data: { url: string; apiKey: string }) {
    const permCheck = await checkPermission(tenantId, currentUser, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!data.url || !data.apiKey) {
        return { error: `Missing required connection details for ${name}.` };
    }
    const hostname = new URL(data.url).hostname;

    const newSource = await knowledgeBaseService.addDataSource({
        tenantId,
        type,
        name: `${name} (${hostname})`,
        status: 'Syncing',
        lastSynced: 'In progress...',
        itemCount: 0,
        config: { url: data.url },
        auth: { apiKey: data.apiKey },
    });

    knowledgeBaseService.syncDataSource(tenantId, newSource.id);
    return { source: newSource };
}


export async function addHighspotSourceAction(tenantId: string, currentUser: CurrentUser, data: { url: string; apiKey: string }) {
    return addSimpleApiSourceAction(tenantId, currentUser, 'highspot', 'Highspot', data);
}

export async function addShowpadSourceAction(tenantId: string, currentUser: CurrentUser, data: { url: string; apiKey: string }) {
    return addSimpleApiSourceAction(tenantId, currentUser, 'showpad', 'Showpad', data);
}

export async function addSeismicSourceAction(tenantId: string, currentUser: CurrentUser, data: { url: string; apiKey: string }) {
    return addSimpleApiSourceAction(tenantId, currentUser, 'seismic', 'Seismic', data);
}

export async function addMindtickleSourceAction(tenantId: string, currentUser: CurrentUser, data: { url: string; apiKey: string }) {
    return addSimpleApiSourceAction(tenantId, currentUser, 'mindtickle', 'Mindtickle', data);
}

export async function addEnableusSourceAction(tenantId: string, currentUser: CurrentUser, data: { url: string; apiKey: string }) {
    return addSimpleApiSourceAction(tenantId, currentUser, 'enableus', 'Enable.us', data);
=======
export async function addHighspotSourceAction(tenantId: string, config: { url: string; apiKey: string }) {
    return addApiBasedSourceAction(tenantId, 'highspot', 'Highspot', config, { apiKey: config.apiKey });
}

export async function addShowpadSourceAction(tenantId: string, config: { url: string; apiKey: string }) {
    return addApiBasedSourceAction(tenantId, 'showpad', 'Showpad', config, { apiKey: config.apiKey });
}

export async function addSeismicSourceAction(tenantId: string, config: { url: string; apiKey: string }) {
    return addApiBasedSourceAction(tenantId, 'seismic', 'Seismic', config, { apiKey: config.apiKey });
}

export async function addMindtickleSourceAction(tenantId: string, config: { url: string; apiKey: string }) {
    return addApiBasedSourceAction(tenantId, 'mindtickle', 'Mindtickle', config, { apiKey: config.apiKey });
}

export async function addEnableusSourceAction(tenantId: string, config: { url: string; apiKey: string }) {
    return addApiBasedSourceAction(tenantId, 'enableus', 'Enable.us', config, { apiKey: config.apiKey });
>>>>>>> 5954e458f850ba2b59f99429a3df305982b426b5
}


export async function resyncKnowledgeSourceAction(tenantId: string, sourceId: string) {
    const permCheck = await checkPermission(tenantId, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };
    
    if (!sourceId) {
        return { error: "Missing required parameters." };
    }
    
    const source = await knowledgeBaseService.getDataSource(tenantId, sourceId);
    if (!source) {
        return { error: "Source not found." };
    }

    await knowledgeBaseService.updateDataSource(tenantId, sourceId, {
        status: 'Syncing',
        lastSynced: 'In progress...',
    });

    knowledgeBaseService.syncDataSource(tenantId, sourceId);

    return { success: true };
}

export async function deleteKnowledgeSourceAction(tenantId: string, sourceId: string) {
    const permCheck = await checkPermission(tenantId, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!sourceId) {
        return { error: "Missing required parameters for deleting source." };
    }
    try {
        const success = await knowledgeBaseService.deleteDataSource(tenantId, sourceId);
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
        const source = await knowledgeBaseService.getDataSource(tenantId, sourceId);
        return { source };
    } catch (e) {
        console.error(e);
        return { error: "Failed to check source status." };
    }
}

// == BILLING ACTIONS ==

const STRIPE_PRICE_IDS = {
    starter: 'price_1Ph_SAMPLE_STARTER', 
    team: 'price_1Ph_SAMPLE_TEAM',
    business: 'price_1Ph_SAMPLE_BUSINESS',
};

export async function createCheckoutSessionAction(plan: 'starter' | 'team' | 'business', tenantId: string) {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_APP_URL) {
        return { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY and NEXT_PUBLIC_APP_URL." };
    }
    
    const priceId = STRIPE_PRICE_IDS[plan];
    if (!priceId) {
        return { error: "Invalid plan selected." };
    }

    const tenant = await getTenantBySubdomain(tenantId);
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
            customer: tenant.stripeCustomerId || undefined,
            customer_creation: tenant.stripeCustomerId ? undefined : 'always',
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

export async function createCustomerPortalSessionAction(tenantId: string) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_APP_URL) {
    return { error: "Stripe is not configured." };
  }

  const tenant = await getTenantBySubdomain(tenantId);
  if (!tenant) {
    return { error: "Tenant not found." };
  }

  if (!tenant.stripeCustomerId) {
    return { error: "Stripe customer ID not found for this tenant." };
  }
  
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.subdomain}/settings/billing`;

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: returnUrl,
    });
    
    return { portalUrl: portalSession.url };

  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return { error: `Stripe error: ${errorMessage}` };
  }
}

// == TEAM MANAGEMENT ACTIONS ==

export async function inviteMemberAction(tenantId: string, email: string, role: Role) {
    const permCheck = await checkPermission(tenantId, 'manageTeam');
    if (permCheck.error) return { error: permCheck.error };
    const { tenant } = permCheck;
    
    if (!email || !role) {
      return { error: "Missing required parameters." };
    }

    const newMember: TeamMember = { id: `pending-${Date.now()}`, name: email, email, role, status: 'Pending' };

    const updatedTenant = await updateTenant(tenant.id, {
        members: [...tenant.members, newMember]
    });

    if (updatedTenant) {
        return { success: true, member: newMember };
    }
    return { error: "Failed to invite member" };
}

export async function removeMemberAction(tenantId: string, memberId: string) {
    const permCheck = await checkPermission(tenantId, 'manageTeam');
    if (permCheck.error) return { error: permCheck.error };
    const { tenant, user } = permCheck;

    if (!memberId) {
      return { error: "Missing required parameters." };
    }
    
    // You can't remove yourself.
    if (memberId === user.id) {
      return { error: "You cannot remove yourself from the workspace."}
    }
    
    const memberToRemove = tenant.members.find(m => m.id === memberId);
    if (!memberToRemove || memberToRemove.role === 'Owner') {
        return { error: "Could not remove member. Owners cannot be removed." };
    }

    const updatedMembers = tenant.members.filter(m => m.id !== memberId);
    const updatedTenant = await updateTenant(tenant.id, { members: updatedMembers });

    return { success: !!updatedTenant };
}

export async function updateMemberRoleAction(tenantId: string, memberId: string, newRole: Role) {
    const permCheck = await checkPermission(tenantId, 'manageTeam');
    if (permCheck.error) return { error: permCheck.error };
    const { tenant } = permCheck;

    if (!memberId || !newRole) {
      return { error: "Missing required parameters." };
    }

    const memberToUpdate = tenant.members.find(m => m.id === memberId);
    if (!memberToUpdate || memberToUpdate.role === 'Owner') {
        return { error: "Could not update role. Owners cannot be changed." };
    }

    const updatedMembers = tenant.members.map(m => m.id === memberId ? { ...m, role: newRole } : m);
    const updatedTenant = await updateTenant(tenant.id, { members: updatedMembers });
    const updatedMember = updatedTenant?.members.find(m => m.id === memberId);
    
    return { success: !!updatedTenant, member: updatedMember };
}

// == SETTINGS ACTIONS ==
export async function updateProfileSettingsAction(tenantId: string, userId: string, data: { name: string }) {
    const session = await getSession();
    const user = session?.user;
    if (!user || user.sub !== userId) {
        return { error: "You can only update your own profile." };
    }

    const permCheck = await checkPermission(tenantId, 'viewContent');
    if (permCheck.error) return { error: permCheck.error };
    const { tenant } = permCheck;
    
    const updatedMembers = tenant.members.map(m => m.id === userId ? { ...m, ...data } : m);
    const updatedTenant = await updateTenant(tenant.id, { members: updatedMembers });
    
    return { member: updatedTenant?.members.find(m => m.id === userId) };
}

export async function updateWorkspaceSettingsAction(tenantId: string, data: Partial<Pick<Tenant, 'name' | 'defaultTone'>>) {
    const permCheck = await checkPermission(tenantId, 'editWorkspace');
    if (permCheck.error) return { error: permCheck.error };
    
    try {
        const updatedTenant = await updateTenant(tenantId, data);
        if (!updatedTenant) return { error: "Tenant not found." };
        return { tenant: updatedTenant };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to update workspace: ${errorMessage}` };
    }
}

export async function updateSecuritySettingsAction(tenantId: string, data: Partial<Pick<Tenant, 'domains'>>) {
    const permCheck = await checkPermission(tenantId, 'manageSecurity');
    if (permCheck.error) return { error: permCheck.error };
    
    try {
        const updatedTenant = await updateTenant(tenantId, data);
        if (!updatedTenant) return { error: "Tenant not found." };
        return { tenant: updatedTenant };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to update security settings: ${errorMessage}` };
    }
}


// == NOTIFICATION ACTIONS ==

export async function getNotificationsAction(tenantId: string, userId: string) {
    if (!tenantId || !userId) {
        return { error: "Missing required parameters." };
    }
    try {
        const notifications = await notificationService.getNotifications(tenantId, userId);
        return { success: true, notifications };
    } catch (e) {
        console.error(e);
        return { error: "Failed to retrieve notifications." };
    }
}

export async function markNotificationsAsReadAction(tenantId: string, userId: string) {
    if (!tenantId || !userId) {
        return { error: "Missing required parameters." };
    }
    try {
        const notifications = await notificationService.markAllAsRead(tenantId, userId);
        return { success: true, notifications };
    } catch (e) {
        console.error(e);
        return { error: "Failed to update notifications." };
    }
}

// == EXPORT ACTION ==

async function generatePdfBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);
        doc.end();
    });
}

function replacePlaceholders(text: string, placeholders: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => placeholders[key] || match);
}

const renderQACategoryPDF = (category: string, questions: Question[], doc: InstanceType<typeof PDFDocument>) => {
    doc.font('Helvetica-Bold').fontSize(16).text(category, { underline: false });
    doc.moveDown(0.75);
    questions.forEach(q => {
        doc.font('Helvetica-Bold').fontSize(11).text(`Q${q.id}: ${q.question}`);
        doc.font('Helvetica').fontSize(10).text(q.answer || "[No answer provided]", { indent: 20 });
        doc.moveDown();
    });
};

const renderAcknowledgmentsPDF = (acknowledgments: any[], doc: InstanceType<typeof PDFDocument>) => {
    if (acknowledgments.length === 0) return;
    doc.addPage();
    doc.fontSize(18).text('Acknowledgments', { align: 'center' });
    doc.moveDown(2);
    acknowledgments.forEach(ack => {
        doc.font('Helvetica-Bold').fontSize(12).text(`${ack.name} (${ack.role})`);
        doc.font('Helvetica-Oblique').fontSize(10).text(`"${ack.comment}"`, { indent: 20 });
        doc.moveDown();
    });
};

const renderQACategoryDOCX = (category: string, questions: Question[]): Paragraph[] => {
    const children: Paragraph[] = [];
    children.push(new Paragraph({ text: category, heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 240 } }));
    questions.forEach(q => {
        children.push(new Paragraph({ children: [new TextRun({ text: `Q${q.id}: ${q.question}`, bold: true })], spacing: { before: 240, after: 120 } }));
        children.push(new Paragraph({ text: q.answer || "[No answer provided]" }));
    });
    return children;
};

const renderAcknowledgmentsDOCX = (acknowledgments: any[]): Paragraph[] => {
    if (acknowledgments.length === 0) return [];
    const children: Paragraph[] = [];
    children.push(new Paragraph({ text: 'Acknowledgments', heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 240 } }));
    acknowledgments.forEach(ack => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${ack.name} (${ack.role})`, bold: true })], spacing: { before: 240, after: 60 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: `"${ack.comment}"`, italics: true })], indent: { left: 720 } }));
    });
    return children;
};


export async function exportRfpAction(payload: {
    tenantId: string;
    rfpId: string;
    templateId: string;
    exportVersion: string,
    format: 'pdf' | 'docx' | 'xlsx',
    acknowledgments: { name: string; role: string; comment: string }[]
}) {
    const { tenantId, rfpId, templateId, exportVersion, format, acknowledgments } = payload;
    
    const permCheck = await checkPermission(tenantId, 'finalizeExport');
    if (permCheck.error) return { error: permCheck.error };
    const { user, tenant } = permCheck;

    const template = await templateService.getTemplate(tenant.id, templateId);
    if (!template) {
        return { error: "Template not found." };
    }
    
    if (template.type === 'Custom' && !hasFeatureAccess(tenant, 'customTemplates')) {
        return { error: 'Custom export templates are not available on your current plan. Please upgrade or use a system template.' };
    }

    const rfp = await rfpService.getRfp(tenant.id, rfpId);
    if (!rfp) {
        return { error: "RFP not found." };
    }
    const { questions } = rfp;


    const isAdminOrOwner = user.role === 'Admin' || user.role === 'Owner';
    const allQuestionsCompleted = questions.every(q => q.status === 'Completed');

    if (!allQuestionsCompleted && !isAdminOrOwner) {
        return { error: "Export failed: All questions must be marked as 'Completed' before a non-admin can export." };
    }
    
    const fileName = `RFP_Response_${exportVersion.replace(/\s+/g, '_')}.${format}`;

    try {
        const questionsByCategory = questions.reduce((acc, q) => {
            const category = q.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(q);
            return acc;
        }, {} as Record<string, Question[]>);

        const placeholderValues = {
            version: exportVersion,
            tenantName: tenant.name,
            currentDate: new Date().toLocaleDateString(),
        };

        const renderedQuestionIds = new Set<number>();
        let fileData;
        let mimeType;

        if (format === 'docx') {
            const docChildren: Paragraph[] = [];

            for (const section of template.structure) {
                const content = replacePlaceholders(section.content, placeholderValues);
                switch (section.type) {
                    case 'title':
                        docChildren.push(new Paragraph({ text: content, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));
                        break;
                    case 'header':
                        content.split('\n').forEach(line => 
                            docChildren.push(new Paragraph({ text: line, heading: HeadingLevel.HEADING_2 }))
                        );
                        break;
                    case 'custom_text':
                        docChildren.push(new Paragraph({ text: content, spacing: { before: 240, after: 240 } }));
                        break;
                    case 'qa_list_by_category':
                        const category = content;
                        let questionsToRender: Question[] = [];

                        if (category === '*') {
                             questionsToRender = questions.filter(q => !renderedQuestionIds.has(q.id));
                        } else {
                            questionsToRender = (questionsByCategory[category] || []).filter(q => !renderedQuestionIds.has(q.id));
                        }

                        if (questionsToRender.length > 0) {
                             docChildren.push(...renderQACategoryDOCX(category === '*' ? 'Other Questions' : category, questionsToRender));
                             questionsToRender.forEach(q => renderedQuestionIds.add(q.id));
                        }
                        break;
                    case 'acknowledgments':
                         if (acknowledgments.length > 0) {
                            docChildren.push(...renderAcknowledgmentsDOCX(acknowledgments));
                        }
                        break;
                    case 'page_break':
                        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
                        break;
                }
            }

            const doc = new Document({ sections: [{ properties: {}, children: docChildren }] });
            fileData = await Packer.toBase64String(doc);
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });

            for (const section of template.structure) {
                const content = replacePlaceholders(section.content, placeholderValues);
                switch (section.type) {
                    case 'title':
                        doc.fontSize(24).text(content, { align: 'center' });
                        doc.moveDown(2);
                        break;
                    case 'header':
                         content.split('\n').forEach(line => 
                            doc.fontSize(16).text(line, { align: 'left' })
                        );
                        doc.moveDown(2);
                        break;
                    case 'custom_text':
                        doc.font('Helvetica').fontSize(10).text(content);
                        doc.moveDown();
                        break;
                    case 'qa_list_by_category':
                         const category = content;
                         let questionsToRender: Question[] = [];

                         if (category === '*') {
                            questionsToRender = questions.filter(q => !renderedQuestionIds.has(q.id));
                         } else {
                            questionsToRender = (questionsByCategory[category] || []).filter(q => !renderedQuestionIds.has(q.id));
                         }

                         if (questionsToRender.length > 0) {
                            renderQACategoryPDF(category === '*' ? 'Other Questions' : category, questionsToRender, doc);
                            questionsToRender.forEach(q => renderedQuestionIds.add(q.id));
                         }
                        break;
                    case 'acknowledgments':
                        renderAcknowledgmentsPDF(acknowledgments, doc);
                        break;
                    case 'page_break':
                        doc.addPage();
                        break;
                }
            }

            const pdfBuffer = await generatePdfBuffer(doc);
            fileData = pdfBuffer.toString('base64');
            mimeType = 'application/pdf';

        } else if (format === 'xlsx') {
            const worksheetData = questions.map(q => ({
                'ID': q.id,
                'Category': q.category,
                'Question': q.question,
                'Answer': q.answer,
                'Status': q.status,
                'Assignee': q.assignee?.name || 'Unassigned',
                'Tags': q.tags?.join(', ') || ''
            }));
            
            const worksheet = xlsx.utils.json_to_sheet(worksheetData);
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, 'RFP Questions');

            worksheet['!cols'] = [
                { wch: 5 },
                { wch: 15 },
                { wch: 60 },
                { wch: 80 },
                { wch: 15 },
                { wch: 20 },
                { wch: 30 },
            ];

            const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
            fileData = excelBuffer.toString('base64');
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else {
            return { error: "Invalid export format specified." };
        }
        
        await exportService.addExportRecord(tenant.id, {
            rfpId,
            rfpName: rfp.name,
            version: exportVersion,
            format,
            exportedAt: new Date().toISOString(),
            exportedBy: user,
            questionCount: questions.length,
            questions: questions,
            acknowledgments,
        });

        return {
            success: true,
            fileData,
            fileName,
            mimeType,
        };
    } catch (e) {
        console.error("Export failed:", e);
        return { error: "An unexpected error occurred during file generation." };
    }
}


export async function getExportHistoryAction(tenantId: string, rfpId?: string) {
    if (!tenantId) {
        return { error: "Missing required parameters." };
    }
    try {
        const history = await exportService.getExportHistory(tenantId, rfpId);
        return { success: true, history };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to retrieve export history: ${errorMessage}` };
    }
}

// == TEMPLATE ACTIONS ==

export async function getTemplatesAction(tenantId: string): Promise<{ templates?: Template[], error?: string }> {
    const permCheck = await checkPermission(tenantId, 'viewContent');
    if (permCheck.error) return { error: permCheck.error };
    
    try {
        const templates = await templateService.getTemplates(tenantId);
        return { templates };
    } catch (e) {
        return { error: 'Failed to retrieve templates.' };
    }
}

export async function getTemplateAction(tenantId: string, templateId: string): Promise<{ template?: Template, error?: string }> {
    const permCheck = await checkPermission(tenantId, 'viewContent');
    if (permCheck.error) return { error: permCheck.error };
    
    try {
        const template = await templateService.getTemplate(tenantId, templateId);
        if (!template) return { error: 'Template not found.' };
        return { template };
    } catch (e) {
        return { error: 'Failed to retrieve template.' };
    }
}

export async function createTemplateAction(tenantId: string, data: { name: string; description: string }): Promise<{ template?: Template, error?: string }> {
    const permCheck = await checkPermission(tenantId, 'editWorkspace');
    if (permCheck.error) return { error: permCheck.error };
    
    try {
        const template = await templateService.createTemplate(tenantId, data);
        return { template };
    } catch (e) {
        return { error: 'Failed to create template.' };
    }
}

export async function updateTemplateAction(tenantId: string, templateId: string, data: { name?: string; description?: string; structure?: TemplateSection[] }): Promise<{ template?: Template, error?: string }> {
    const permCheck = await checkPermission(tenantId, 'editWorkspace');
    if (permCheck.error) return { error: permCheck.error };

    try {
        const template = await templateService.updateTemplate(tenantId, templateId, data);
        if (!template) return { error: 'Could not update template. System templates are protected or template not found.' };
        return { template };
    } catch (e) {
        return { error: 'Failed to update template.' };
    }
}

export async function duplicateTemplateAction(tenantId: string, templateId: string): Promise<{ template?: Template, error?: string }> {
    const permCheck = await checkPermission(tenantId, 'editWorkspace');
    if (permCheck.error) return { error: permCheck.error };

    try {
        const template = await templateService.duplicateTemplate(tenantId, templateId);
        if (!template) return { error: 'Template not found.' };
        return { template };
    } catch (e) {
        return { error: 'Failed to duplicate template.' };
    }
}

export async function deleteTemplateAction(tenantId: string, templateId: string): Promise<{ success?: boolean, error?: string }> {
    const permCheck = await checkPermission(tenantId, 'editWorkspace');
    if (permCheck.error) return { error: permCheck.error };

    try {
        const success = await templateService.deleteTemplate(tenantId, templateId);
        if (!success) return { error: 'Could not delete template. System templates are protected.' };
        return { success };
    } catch (e) {
        return { error: 'Failed to delete template.' };
    }
}

export async function getTenantBySubdomainAction(subdomain: string): Promise<{ tenant?: Tenant, error?: string }> {
    try {
        const tenant = await getTenantBySubdomain(subdomain);
        if (!tenant) {
            return { error: 'Tenant not found.' };
        }
        return { tenant: tenant }; // service already sanitizes data
    } catch (e: any) {
        console.error(`Action failed: getTenantBySubdomainAction for ${subdomain}`, e);
        return { error: e.message || 'Failed to retrieve tenant information.' };
    }
}

export async function updateKnowledgeSourceConfigAction(tenantId: string, sourceId: string, config: DataSource['config']) {
    const permCheck = await checkPermission(tenantId, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!sourceId || !config) {
        return { error: "Missing required parameters." };
    }

    try {
        const source = await knowledgeBaseService.updateDataSource(tenantId, sourceId, { config });
        if (!source) {
            return { error: "Source not found or could not be updated." };
        }

        // Trigger a re-sync in the background
        knowledgeBaseService.syncDataSource(tenantId, sourceId);

        return { success: true, source };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to update source configuration: ${errorMessage}` };
    }
}

export async function askAiAction(query: string, tenantId: string): Promise<{ answer?: string, sources?: string[], error?: string }> {
    if (!query) {
        return { error: "Query cannot be empty." };
    }
    if (!tenantId) {
        return { error: "Tenant not found." };
    }
    
    // In a real app with auth, we'd check permissions here. For now, we assume access.
    
    try {
        const result = await askAi({ query, tenantId });
        return { answer: result.answer, sources: result.sources };
    } catch (e) {
        console.error("Ask AI action failed:", e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while asking AI.";
        return { error: errorMessage };
    }
}

// == ANSWER LIBRARY ACTIONS ==

export async function getAnswerLibraryAction(tenantId: string): Promise<{ answers?: QnAPair[], error?: string }> {
    if (!tenantId) return { error: "Tenant not found." };
    try {
        const answers = await answerLibraryService.getLibrary(tenantId);
        return { answers: JSON.parse(JSON.stringify(answers)) };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to get answer library: ${errorMessage}` };
    }
}

export async function saveToLibraryAction(payload: {
    tenantId: string;
    question: string;
    answer: string;
    category: string;
    tags: string[];
}) {
    const { tenantId, ...data } = payload;
    const permCheck = await checkPermission(tenantId, 'editContent');
    if (permCheck.error) return { error: permCheck.error };
    const { user } = permCheck;

    try {
        const savedAnswer = await answerLibraryService.addOrUpdate({
            ...data,
            tenantId: tenantId,
            status: 'Approved',
            createdBy: user,
        });
        return { success: true, answer: savedAnswer };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to save answer to library: ${errorMessage}` };
    }
}

export async function deleteFromLibraryAction(tenantId: string, id: string) {
    const permCheck = await checkPermission(tenantId, 'editContent');
    if (permCheck.error) return { error: permCheck.error };

    try {
        const success = await answerLibraryService.deleteAnswer(tenantId, id);
        return { success };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to delete answer from library: ${errorMessage}` };
    }
}

<<<<<<< HEAD
export async function getRfpInsightsAction(tenantId: string, currentUser: CurrentUser): Promise<{ insights?: RfpInsightsOutput, error?: string }> {
    const permCheck = await checkPermission(tenantId, currentUser, 'viewContent');
    if (permCheck.error) return { error: permCheck.error };

    try {
        const insights = await generateRfpInsights({ tenantId });
        return { insights };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while generating insights.";
        return { error: errorMessage };
    }
=======
// == ONBOARDING ACTIONS ==
export async function completeOnboardingAction(tenantId: string) {
    const session = await getSession();
    if (!session || !session.user || session.user.sub !== tenantId) {
        return { error: 'Unauthorized' };
    }
    
    const updatedTenant = await updateTenant(tenantId, { onboardingCompleted: true });
    
    if (updatedTenant) {
        return { success: true, tenant: updatedTenant };
    }
    
    return { error: 'Failed to update workspace.' };
>>>>>>> 5954e458f850ba2b59f99429a3df305982b426b5
}
