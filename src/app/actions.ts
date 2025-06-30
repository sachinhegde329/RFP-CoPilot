
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
    type Role
} from "@/lib/tenants"
import { stripe } from "@/lib/stripe"
import { hasFeatureAccess } from "@/lib/access-control"
import { notificationService } from "@/lib/notifications.service";

import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import PDFDocument from 'pdfkit';


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

export async function extractQuestionsAction(rfpText: string, tenantId: string) {
  if (!rfpText) {
    return { error: "RFP text cannot be empty." }
  }
  if (!tenantId) {
    return { error: "Tenant ID is missing." }
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

export async function updateQuestionAction(tenantId: string, questionId: number, updates: Partial<Question>) {
    if (!tenantId || !questionId) {
        return { error: "Missing required parameters." };
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

export async function addQuestionAction(tenantId: string, questionData: Omit<Question, 'id'>) {
    if (!tenantId || !questionData) {
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

export async function inviteMemberAction(tenantId: string, email: string, role: Role) {
  if (!tenantId || !email || !role) {
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

export async function removeMemberAction(tenantId: string, memberId: number) {
  if (!tenantId || !memberId) {
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

export async function updateMemberRoleAction(tenantId: string, memberId: number, newRole: Role) {
  if (!tenantId || !memberId || !newRole) {
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

export async function exportRfpAction(payload: {
    questions: { id: number, question: string, status: string, answer: string }[],
    isLocked: boolean,
    currentUserRole: Role,
    exportVersion: string,
    format: 'pdf' | 'docx',
    acknowledgments: { name: string, role: string, comment: string }[]
}) {
    const { questions, isLocked, currentUserRole, exportVersion, format, acknowledgments } = payload;

    if (!isLocked) {
        return { error: "Export failed: The RFP must be locked before exporting." };
    }

    const isAdmin = currentUserRole === 'Admin' || currentUserRole === 'Owner';
    const allQuestionsCompleted = questions.every(q => q.status === 'Completed');

    if (!allQuestionsCompleted && !isAdmin) {
        return { error: "Export failed: All questions must be marked as 'Completed' before a non-admin can export." };
    }
    
    const fileName = `RFP_Response_${exportVersion.replace(/\s+/g, '_')}.${format}`;

    try {
        if (format === 'docx') {
            const docChildren: Paragraph[] = [
                new Paragraph({ text: `RFP Response - Version ${exportVersion}`, heading: HeadingLevel.TITLE }),
                ...questions.flatMap(q => [
                    new Paragraph({
                        children: [new TextRun({ text: `Q${q.id}: ${q.question}`, bold: true })],
                        spacing: { before: 240, after: 120 }
                    }),
                    new Paragraph({
                        text: q.answer || "No answer provided.",
                    })
                ])
            ];

            if (acknowledgments.length > 0) {
                docChildren.push(new Paragraph({ text: 'Acknowledgments', heading: HeadingLevel.TITLE, pageBreakBefore: true }));
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

            const base64 = await Packer.toBase64String(doc);
            return {
                success: true,
                fileData: base64,
                fileName,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            };

        } else if (format === 'pdf') {
            return new Promise((resolve, reject) => {
                const doc = new PDFDocument({ margin: 50, bufferPages: true });
                const buffers: Buffer[] = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers).toString('base64');
                    resolve({
                        success: true,
                        fileData: pdfData,
                        fileName,
                        mimeType: 'application/pdf',
                    });
                });
                doc.on('error', reject);

                // Add content
                doc.fontSize(25).text(`RFP Response - Version ${exportVersion}`, { align: 'center' });
                doc.moveDown(2);

                questions.forEach(q => {
                    doc.fontSize(14).font('Helvetica-Bold').text(`Q${q.id}: ${q.question}`);
                    doc.moveDown(0.5);
                    doc.fontSize(12).font('Helvetica').text(q.answer || "No answer provided.");
                    doc.moveDown(1.5);
                });

                if (acknowledgments.length > 0) {
                    doc.addPage();
                    doc.fontSize(25).text('Acknowledgments', { align: 'center' });
                    doc.moveDown(2);
                    acknowledgments.forEach(ack => {
                        doc.fontSize(14).font('Helvetica-Bold').text(`${ack.name} (${ack.role})`);
                        doc.moveDown(0.5);
                        doc.fontSize(12).font('Helvetica-Oblique').text(`"${ack.comment}"`);
                        doc.moveDown(1.5);
                    });
                }

                doc.end();
            });
        } else {
            return { error: "Invalid export format specified." };
        }
    } catch (e) {
        console.error("Export failed:", e);
        return { error: "An unexpected error occurred during file generation." };
    }
}
