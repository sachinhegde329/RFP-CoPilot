
import { getTenantBySubdomain } from './tenants';
import type { TeamMember } from './tenant-types';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, type DocumentSnapshot } from 'firebase/firestore';
import type { Question, RFP } from './rfp-types';

// NOTE: This service is now migrated to use Firestore for data persistence.

/**
 * A robust way to convert Firestore-specific types (like Timestamps) to plain JSON.
 * This prevents serialization errors when passing data from Server to Client Components.
 * @param data The data to be sanitized.
 * @returns A clean, serializable object.
 */
function sanitizeData<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
}

class RfpService {

    private getRfpsCollection(tenantId: string) {
        return collection(db, 'tenants', tenantId, 'rfps');
    }

    public async getRfps(tenantId: string): Promise<RFP[]> {
        const rfpsCollection = this.getRfpsCollection(tenantId);
        const snapshot = await getDocs(query(rfpsCollection));
        if (snapshot.empty) {
            // Seed data for megacorp demo tenant
            if (tenantId === 'megacorp') {
                const tenant = await getTenantBySubdomain('megacorp');
                if (!tenant) return [];
                const sampleQuestions = getSampleQuestions(tenant.members);
                const rfpsToSeed: RFP[] = [
                    { id: 'rfp-1', name: 'Q3 Enterprise Security RFP', status: 'Open', questions: sampleQuestions, topics: ['security', 'compliance', 'enterprise'] },
                    { id: 'rfp-2', name: 'Project Titan Proposal', status: 'Draft', questions: [sampleQuestions[3], sampleQuestions[2]], topics: ['product', 'pricing'] },
                    { id: 'rfp-3', name: '2023 Compliance Audit', status: 'Completed', questions: [sampleQuestions[0], sampleQuestions[1]], topics: ['security', 'legal', 'audit'] },
                ];
                for (const rfp of rfpsToSeed) {
                    await setDoc(doc(rfpsCollection, rfp.id), rfp);
                }
                // Seeded data is clean, but sanitize for consistency.
                return sanitizeData(rfpsToSeed);
            }
            return [];
        }
        
        // Manually reconstruct objects to guarantee they are plain data and avoid serialization issues.
        const rfps = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                name: data.name,
                status: data.status,
                questions: data.questions || [],
                topics: data.topics || [],
            } as RFP;
        });

        return sanitizeData(rfps);
    }
    
    public async getRfp(tenantId: string, rfpId: string): Promise<RFP | undefined> {
        const rfpDoc = await getDoc(doc(this.getRfpsCollection(tenantId), rfpId));
        if (!rfpDoc.exists()) return undefined;

        const data = rfpDoc.data();
        const rfp = {
            id: rfpDoc.id,
            name: data.name,
            status: data.status,
            questions: data.questions || [],
            topics: data.topics || [],
        } as RFP;
        
        return sanitizeData(rfp);
    }

    public async updateQuestion(tenantId: string, rfpId: string, questionId: number, updates: Partial<Question>): Promise<Question | null> {
        const rfp = await this.getRfp(tenantId, rfpId);
        if (!rfp) return null;
        
        const questionIndex = rfp.questions.findIndex(q => q.id === questionId);
        if (questionIndex > -1) {
            const updatedQuestion = { ...rfp.questions[questionIndex], ...updates };
            rfp.questions[questionIndex] = updatedQuestion;
            // rfp is already sanitized from the getRfp call
            await updateDoc(doc(this.getRfpsCollection(tenantId), rfpId), { questions: rfp.questions });
            return sanitizeData(updatedQuestion);
        }
        return null;
    }

    public async addRfp(tenantId: string, name: string, questions: Question[], topics: string[] = []): Promise<RFP> {
        const newRfpId = `rfp-${Date.now()}`;
        const newRfp: RFP = {
            id: newRfpId,
            name,
            questions,
            status: 'Draft',
            topics,
        };
        await setDoc(doc(this.getRfpsCollection(tenantId), newRfpId), newRfp);
        return newRfp;
    }

    public async addQuestion(tenantId: string, rfpId: string, questionData: Omit<Question, 'id'>): Promise<Question> {
        const rfp = await this.getRfp(tenantId, rfpId);
        if (!rfp) throw new Error("RFP not found");

        const questions = rfp.questions;
        const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
        const newQuestion: Question = {
            ...questionData,
            id: newId,
        };
        questions.push(newQuestion);
        await updateDoc(doc(this.getRfpsCollection(tenantId), rfpId), { questions: questions });
        return newQuestion;
    }
}

export const rfpService = new RfpService();

const getSampleQuestions = (members: TeamMember[]): Question[] => [
    {
      id: 1,
      question: "What is your data retention policy, and how do you ensure customer data is securely deleted upon request?",
      answer: "Our data retention policy adheres to industry best practices, retaining customer data for the duration of the contract plus an additional 90 days for recovery purposes. Upon a verified request, data is securely deleted from all active and backup systems using a 3-pass overwrite method to ensure it is irrecoverable.",
      category: "Security",
      compliance: "pending",
      assignee: members.find((m: any) => m.role === 'Admin') || null,
      status: 'In Progress'
    },
    {
      id: 2,
      question: "Can you describe your Service Level Agreement (SLA) for production uptime and provide details on support tiers?",
      answer: "Our standard SLA guarantees 99.9% uptime for our production environment, excluding scheduled maintenance. We offer two support tiers: Standard (9-5 business hours, email support) and Premium (24/7 phone and email support with a 1-hour response time for critical issues).",
      category: "Legal",
      compliance: "pending",
      assignee: members.find((m: any) => m.role === 'Owner') || null,
      status: 'In Progress'
    },
    {
      id: 3,
      question: "Please outline your pricing structure, including any volume discounts or multi-year contract options.",
      answer: "",
      category: "Pricing",
      compliance: "pending",
      assignee: null,
      status: 'Unassigned'
    },
    {
      id: 4,
      question: "How does your solution integrate with third-party CRM platforms like Salesforce?",
      answer: "Our solution provides a native, bi-directional integration with Salesforce via a managed package available on the AppExchange. This integration syncs custom objects, standard objects, and allows for seamless data flow between the two platforms without the need for middleware.",
      category: "Product",
      compliance: "pending",
      assignee: members.find((m: any) => m.role === 'Editor') || null,
      status: 'Completed'
    }
];
