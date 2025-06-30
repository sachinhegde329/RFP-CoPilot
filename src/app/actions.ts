
"use server"

import { generateDraftAnswer } from "@/ai/flows/smart-answer-generation"
import { aiExpertReview } from "@/ai/flows/ai-expert-review"
import { extractRfpQuestions } from "@/ai/flows/extract-rfp-questions"
import { parseDocument } from "@/ai/flows/parse-document"
import { knowledgeBaseService } from "@/lib/knowledge-base"
import { rfpService, type Question } from "@/lib/rfp.service"
import {
    getTenantBySubdomain,
    plansConfig,
    inviteMember as inviteMemberToTenant,
    removeMember as removeMemberFromTenant,
    updateMemberRole as updateMemberRoleInTenant,
    type Role,
    type TeamMember,
    type Tenant
} from "@/lib/tenants"
import { stripe } from "@/lib/stripe"
import { hasFeatureAccess, canPerformAction, type Action } from "@/lib/access-control"
import { notificationService } from "@/lib/notifications.service";
import { exportService } from "@/lib/export.service";
import { templateService, type Template } from "@/lib/template.service"

import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx';
import PDFDocument from 'pdfkit';

type CurrentUser = { id: number; role: Role; name: string; }

// Helper function to check permissions before executing an action
function checkPermission(tenantId: string, currentUser: CurrentUser, action: Action): { tenant: Tenant, user: TeamMember, error?: undefined } | { error: string } {
    const tenant = getTenantBySubdomain(tenantId);
    if (!tenant) return { error: "Tenant not found." };
    
    // In a real app, the user would be loaded from a secure session, not found in the tenant members list.
    const user = tenant.members.find(m => m.id === currentUser.id); 
    if (!user) return { error: "User not found." };
    
    if (!canPerformAction(user.role, action)) {
        return { error: "You do not have permission to perform this action." };
    }
    
    return { tenant, user };
}

// This action is used by the main dashboard's RfpSummaryCard
export async function parseDocumentAction(documentDataUri: string, tenantId: string, currentUser: CurrentUser) {
    const permCheck = checkPermission(tenantId, currentUser, 'uploadRfps');
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

export async function generateAnswerAction(question: string, tenantId: string, currentUser: CurrentUser) {
  const permCheck = checkPermission(tenantId, currentUser, 'editContent');
  if (permCheck.error) return { error: permCheck.error };
  const { tenant } = permCheck;

  if (!question) {
    return { error: "Question cannot be empty." }
  }

  try {
    const relevantChunks = await knowledgeBaseService.searchChunks(tenantId, question, {
        topK: 5,
        sourceTypes: ['document', 'website'],
    });
    
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
      tone: tenant.defaultTone || "Formal",
    })
    return { answer: result.draftAnswer, sources: result.sources, confidenceScore: result.confidenceScore }
  } catch (e) {
    console.error(e)
    return { error: "Failed to generate answer." }
  }
}

export async function reviewAnswerAction(question: string, answer: string, tenantId: string, currentUser: CurrentUser) {
  const permCheck = checkPermission(tenantId, currentUser, 'editContent');
  if (permCheck.error) return { error: permCheck.error };
  const { tenant } = permCheck;
  
  if (!question || !answer) {
    return { error: "Question and answer cannot be empty." }
  }
  
  const canAccess = hasFeatureAccess(tenant, 'aiExpertReview');
  if (!canAccess) {
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

export async function extractQuestionsAction(rfpText: string, tenantId: string, currentUser: CurrentUser) {
  const permCheck = checkPermission(tenantId, currentUser, 'uploadRfps');
  if (permCheck.error) return { error: permCheck.error };

  if (!rfpText) {
    return { error: "RFP text cannot be empty." }
  }

  try {
    const result = await extractRfpQuestions({ documentText: rfpText })
    const questionsWithStatus = result.questions.map(q => ({
      ...q,
      answer: "",
      compliance: "pending" as const,
      assignee: null,
      status: "Unassigned" as const,
    }))
    // Persist the extracted questions
    const savedQuestions = rfpService.setQuestions(tenantId, questionsWithStatus);
    return { questions: savedQuestions }
  } catch (e) {
    console.error(e)
    return { error: "Failed to extract questions from RFP." }
  }
}

export async function updateQuestionAction(tenantId: string, questionId: number, updates: Partial<Question>, currentUser: CurrentUser) {
    const permCheck = checkPermission(tenantId, currentUser, 'editContent');
    if (permCheck.error) return { error: permCheck.error };
    
    if (!questionId) {
        return { error: "Missing question ID." };
    }
    
    // If the update includes assigning a user, check for assign permission
    if (updates.assignee !== undefined) {
        if (!canPerformAction(currentUser.role, 'assignQuestions')) {
            return { error: "You do not have permission to assign questions." };
        }
    }

    try {
        const updatedQuestion = rfpService.updateQuestion(tenantId, questionId, updates);
        if (!updatedQuestion) {
            return { error: "Question not found or could not be updated." };
        }
        return { success: true, question: updatedQuestion };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to update question: ${errorMessage}` };
    }
}

export async function addQuestionAction(tenantId: string, questionData: Omit<Question, 'id'>, currentUser: CurrentUser) {
    const permCheck = checkPermission(tenantId, currentUser, 'editContent');
    if (permCheck.error) return { error: permCheck.error };

    if (!questionData) {
        return { error: "Missing required parameters." };
    }
    try {
        const newQuestion = rfpService.addQuestion(tenantId, questionData);
        return { success: true, question: newQuestion };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to add question: ${errorMessage}` };
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

export async function addDocumentSourceAction(documentDataUri: string, tenantId: string, fileName: string, currentUser: CurrentUser) {
    const permCheck = checkPermission(tenantId, currentUser, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!documentDataUri || !fileName) {
        return { error: "Missing required parameters for adding document." };
    }

    const newSource = knowledgeBaseService.addDataSource({
        tenantId,
        type: 'document',
        name: fileName,
        status: 'Syncing',
        lastSynced: 'In progress...',
        uploader: currentUser.name,
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

export async function addWebsiteSourceAction(url: string, tenantId: string, currentUser: CurrentUser) {
    const permCheck = checkPermission(tenantId, currentUser, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!url) {
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


export async function resyncKnowledgeSourceAction(tenantId: string, sourceId: string, currentUser: CurrentUser) {
    const permCheck = checkPermission(tenantId, currentUser, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };
    
    if (!sourceId) {
        return { error: "Missing required parameters." };
    }
    
    const source = knowledgeBaseService.getDataSource(tenantId, sourceId);
    if (!source) {
        return { error: "Source not found." };
    }

    knowledgeBaseService.updateDataSource(tenantId, sourceId, {
        status: 'Syncing',
        lastSynced: 'In progress...',
    });

    // Don't await this, let it run in the background
    knowledgeBaseService.syncDataSource(tenantId, sourceId);

    return { success: true };
}

export async function deleteKnowledgeSourceAction(tenantId: string, sourceId: string, currentUser: CurrentUser) {
    const permCheck = checkPermission(tenantId, currentUser, 'manageIntegrations');
    if (permCheck.error) return { error: permCheck.error };

    if (!sourceId) {
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

export async function createCustomerPortalSessionAction(tenantId: string) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_APP_URL) {
    return { error: "Stripe is not configured." };
  }

  const tenant = getTenantBySubdomain(tenantId);
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

export async function inviteMemberAction(tenantId: string, email: string, role: Role, currentUser: CurrentUser) {
    const permCheck = checkPermission(tenantId, currentUser, 'manageTeam');
    if (permCheck.error) return { error: permCheck.error };

  if (!email || !role) {
    return { error: "Missing required parameters." };
  }
  try {
    const newMember = inviteMemberToTenant(tenantId, email, role);
    if (!newMember) {
      return { error: `Could not invite ${email}. They may already be a member.` };
    }
    // In a real app, you would send an invitation email here.
    return { success: true, member: newMember };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return { error: `Failed to invite member: ${errorMessage}` };
  }
}

export async function removeMemberAction(tenantId: string, memberId: number, currentUser: CurrentUser) {
    const permCheck = checkPermission(tenantId, currentUser, 'manageTeam');
    if (permCheck.error) return { error: permCheck.error };

  if (!memberId) {
    return { error: "Missing required parameters." };
  }
  try {
    const success = removeMemberFromTenant(tenantId, memberId);
    if (!success) {
      return { error: "Could not remove member. Owners cannot be removed." };
    }
    return { success: true };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return { error: `Failed to remove member: ${errorMessage}` };
  }
}

export async function updateMemberRoleAction(tenantId: string, memberId: number, newRole: Role, currentUser: CurrentUser) {
    const permCheck = checkPermission(tenantId, currentUser, 'manageTeam');
    if (permCheck.error) return { error: permCheck.error };

  if (!memberId || !newRole) {
    return { error: "Missing required parameters." };
  }
  try {
    const updatedMember = updateMemberRoleInTenant(tenantId, memberId, newRole);
    if (!updatedMember) {
      return { error: "Could not update role. Owners cannot be changed." };
    }
    return { success: true, member: updatedMember };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return { error: `Failed to update member role: ${errorMessage}` };
  }
}

// == NOTIFICATION ACTIONS ==

export async function getNotificationsAction(tenantId: string, userId: number) {
    if (!tenantId || !userId) {
        return { error: "Missing required parameters." };
    }
    try {
        const notifications = notificationService.getNotifications(tenantId, userId);
        return { success: true, notifications };
    } catch (e) {
        console.error(e);
        return { error: "Failed to retrieve notifications." };
    }
}

export async function markNotificationsAsReadAction(tenantId: string, userId: number) {
    if (!tenantId || !userId) {
        return { error: "Missing required parameters." };
    }
    try {
        const notifications = notificationService.markAllAsRead(tenantId, userId);
        return { success: true, notifications };
    } catch (e) {
        console.error(e);
        return { error: "Failed to update notifications." };
    }
}

// == EXPORT ACTION ==

/**
 * Helper function to convert a PDFKit document stream to a buffer.
 */
async function generatePdfBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);
        doc.end();
    });
}


export async function exportRfpAction(payload: {
    tenantId: string;
    rfpId: string;
    templateId: string;
    questions: Question[],
    currentUser: CurrentUser,
    exportVersion: string,
    format: 'pdf' | 'docx',
    acknowledgments: { name: string, role: string, comment: string }[]
}) {
    const { tenantId, rfpId, templateId, questions, currentUser, exportVersion, format, acknowledgments } = payload;
    
    const permCheck = checkPermission(tenantId, currentUser, 'finalizeExport');
    if (permCheck.error) return { error: permCheck.error };
    const { user, tenant } = permCheck;

    const isAdminOrOwner = user.role === 'Admin' || user.role === 'Owner';
    const allQuestionsCompleted = questions.every(q => q.status === 'Completed');

    if (!allQuestionsCompleted && !isAdminOrOwner) {
        return { error: "Export failed: All questions must be marked as 'Completed' before a non-admin can export." };
    }
    
    const fileName = `RFP_Response_${exportVersion.replace(/\s+/g, '_')}.${format}`;

    try {
        // Group questions by category for structured export
        const questionsByCategory = questions.reduce((acc, q) => {
            const category = q.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(q);
            return acc;
        }, {} as Record<string, Question[]>);


        let fileData;
        let mimeType;

        if (format === 'docx') {
            const docChildren: Paragraph[] = [];

            // Template-based header
            if (templateId === 'system-formal-proposal') {
                 docChildren.push(
                    new Paragraph({ text: `Request for Proposal Response`, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: ' ', spacing: { after: 480 } }),
                    new Paragraph({ text: `Prepared by: ${tenant.name}`, heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: `Date: ${new Date().toLocaleDateString()}`, heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ pageBreakBefore: true })
                );
            } else { // Default categorized template
                docChildren.push(new Paragraph({ text: `RFP Response - Version ${exportVersion}`, heading: HeadingLevel.TITLE }));
            }
            
            // Main content
            for (const category in questionsByCategory) {
                docChildren.push(
                    new Paragraph({
                        text: category,
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 480, after: 240 },
                    })
                );
                questionsByCategory[category].forEach(q => {
                    docChildren.push(
                        new Paragraph({
                            children: [new TextRun({ text: `Q${q.id}: ${q.question}`, bold: true })],
                            spacing: { before: 240, after: 120 }
                        }),
                        new Paragraph({
                            text: q.answer || "No answer provided.",
                        })
                    );
                });
            }

            // Acknowledgments
            if (acknowledgments.length > 0) {
                docChildren.push(new Paragraph({ text: 'Acknowledgments', heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { before: 480, after: 240 } }));
                acknowledgments.forEach(ack => {
                    docChildren.push(
                        new Paragraph({
                            children: [new TextRun({ text: `${ack.name} (${ack.role})`, bold: true })],
                            spacing: { before: 240, after: 60 }
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: `"${ack.comment}"`, italics: true })],
                            indent: { left: 720 },
                        })
                    );
                });
            }

            const doc = new Document({ sections: [{ properties: {}, children: docChildren }] });
            
            fileData = await Packer.toBase64String(doc);
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 50, bufferPages: true });

            // Template-based header
             if (templateId === 'system-formal-proposal') {
                doc.fontSize(24).text(`Request for Proposal Response`, { align: 'center' });
                doc.moveDown(4);
                doc.fontSize(16).text(`Prepared by: ${tenant.name}`, { align: 'left' });
                doc.moveDown(1);
                doc.fontSize(16).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'left' });
                doc.addPage();
            } else { // Default
                doc.fontSize(18).text(`RFP Response - Version ${exportVersion}`, { align: 'center' });
                doc.moveDown(2);
            }

            // Main content
            for (const category in questionsByCategory) {
                doc.font('Helvetica-Bold').fontSize(14).text(category, { underline: true });
                doc.moveDown(0.5);

                questionsByCategory[category].forEach(q => {
                    doc.font('Helvetica-Bold').fontSize(11).text(`Q${q.id}: ${q.question}`);
                    doc.font('Helvetica').fontSize(10).text(q.answer || "No answer provided.", { indent: 20 });
                    doc.moveDown();
                });
                doc.moveDown();
            }

            // Acknowledgments
            if (acknowledgments.length > 0) {
                doc.addPage();
                doc.fontSize(18).text('Acknowledgments', { align: 'center' });
                doc.moveDown(2);

                acknowledgments.forEach(ack => {
                    doc.font('Helvetica-Bold').fontSize(12).text(`${ack.name} (${ack.role})`);
                    doc.font('Helvetica-Oblique').fontSize(10).text(`"${ack.comment}"`, { indent: 20 });
                    doc.moveDown();
                });
            }

            const pdfBuffer = await generatePdfBuffer(doc);
            fileData = pdfBuffer.toString('base64');
            mimeType = 'application/pdf';

        } else {
            return { error: "Invalid export format specified." };
        }
        
        exportService.addExportRecord(tenantId, {
            rfpId,
            version: exportVersion,
            format,
            exportedAt: new Date().toISOString(),
            exportedBy: currentUser,
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


export async function getExportHistoryAction(tenantId: string, rfpId: string) {
    if (!tenantId || !rfpId) {
        return { error: "Missing required parameters." };
    }
    try {
        const history = exportService.getExportHistory(tenantId, rfpId);
        return { success: true, history };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        return { error: `Failed to retrieve export history: ${errorMessage}` };
    }
}

// == TEMPLATE ACTIONS ==

export async function getTemplatesAction(tenantId: string, currentUser: CurrentUser): Promise<{ templates?: Template[], error?: string }> {
    const permCheck = checkPermission(tenantId, currentUser, 'viewContent');
    if (permCheck.error) return { error: permCheck.error };
    
    try {
        const templates = templateService.getTemplates(tenantId);
        return { templates };
    } catch (e) {
        return { error: 'Failed to retrieve templates.' };
    }
}

export async function getTemplateAction(tenantId: string, templateId: string, currentUser: CurrentUser): Promise<{ template?: Template, error?: string }> {
    const permCheck = checkPermission(tenantId, currentUser, 'viewContent');
    if (permCheck.error) return { error: permCheck.error };
    
    try {
        const template = templateService.getTemplate(tenantId, templateId);
        if (!template) return { error: 'Template not found.' };
        return { template };
    } catch (e) {
        return { error: 'Failed to retrieve template.' };
    }
}

export async function createTemplateAction(tenantId: string, data: { name: string; description: string }, currentUser: CurrentUser): Promise<{ template?: Template, error?: string }> {
    const permCheck = checkPermission(tenantId, currentUser, 'editWorkspace');
    if (permCheck.error) return { error: permCheck.error };
    
    try {
        const template = templateService.createTemplate(tenantId, data);
        return { template };
    } catch (e) {
        return { error: 'Failed to create template.' };
    }
}

export async function updateTemplateAction(tenantId: string, templateId: string, data: { name?: string; description?: string }, currentUser: CurrentUser): Promise<{ template?: Template, error?: string }> {
    const permCheck = checkPermission(tenantId, currentUser, 'editWorkspace');
    if (permCheck.error) return { error: permCheck.error };

    try {
        const template = templateService.updateTemplate(tenantId, templateId, data);
        if (!template) return { error: 'Could not update template. System templates are protected or template not found.' };
        return { template };
    } catch (e) {
        return { error: 'Failed to update template.' };
    }
}

export async function duplicateTemplateAction(tenantId: string, templateId: string, currentUser: CurrentUser): Promise<{ template?: Template, error?: string }> {
    const permCheck = checkPermission(tenantId, currentUser, 'editWorkspace');
    if (permCheck.error) return { error: permCheck.error };

    try {
        const template = templateService.duplicateTemplate(tenantId, templateId);
        if (!template) return { error: 'Template not found.' };
        return { template };
    } catch (e) {
        return { error: 'Failed to duplicate template.' };
    }
}

export async function deleteTemplateAction(tenantId: string, templateId: string, currentUser: CurrentUser): Promise<{ success?: boolean, error?: string }> {
    const permCheck = checkPermission(tenantId, currentUser, 'editWorkspace');
    if (permCheck.error) return { error: permCheck.error };

    try {
        const success = templateService.deleteTemplate(tenantId, templateId);
        if (!success) return { error: 'Could not delete template. System templates are protected.' };
        return { success };
    } catch (e) {
        return { error: 'Failed to delete template.' };
    }
}
