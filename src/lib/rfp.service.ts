
import { getTenantBySubdomain } from './tenants';
import type { TeamMember } from './tenant-types';
import type { Question, RFP, RfpStatus } from './rfp-types';

// NOTE: With Firebase removed, this service now uses a temporary in-memory store.
// Data will NOT persist across server restarts.

const demoMembers: TeamMember[] = [
    { id: 'user_2fJAnr9bhdC7r4bDBaQzJt0iGzJ', name: 'Alex Johnson', email: 'alex.j@megacorp.com', role: 'Owner', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
    { id: 'user_2fKAnr9bhdC7r4bDBaQzJt0iGzK', name: 'Maria Garcia', email: 'maria.g@megacorp.com', role: 'Admin', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
    { id: 'user_2fLAnr9bhdC7r4bDBaQzJt0iGzL', name: 'Priya Patel', email: 'priya.p@megacorp.com', role: 'Editor', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
];

const getSampleQuestions = (members: TeamMember[]): Question[] => [
    {
      id: 1,
      question: "What is your data retention policy, and how do you ensure customer data is securely deleted upon request?",
      answer: "Our data retention policy adheres to industry best practices, retaining customer data for the duration of the contract plus an additional 90 days for recovery purposes. Upon a verified request, data is securely deleted from all active and backup systems using a 3-pass overwrite method to ensure it is irrecoverable.",
      category: "Security",
      compliance: "pending",
      assignee: members.find((m: any) => m.role === 'Admin') || null,
      status: 'In Progress',
      tags: ['GDPR', 'data-security', 'deletion'],
    },
    {
      id: 2,
      question: "Can you describe your Service Level Agreement (SLA) for production uptime and provide details on support tiers?",
      answer: "Our standard SLA guarantees 99.9% uptime for our production environment, excluding scheduled maintenance. We offer two support tiers: Standard (9-5 business hours, email support) and Premium (24/7 phone and email support with a 1-hour response time for critical issues).",
      category: "Legal",
      compliance: "pending",
      assignee: members.find((m: any) => m.role === 'Owner') || null,
      status: 'In Progress',
      tags: ['SLA', 'support'],
    },
    {
      id: 3,
      question: "Please outline your pricing structure, including any volume discounts or multi-year contract options.",
      answer: "",
      category: "Pricing",
      compliance: "pending",
      assignee: null,
      status: 'Unassigned',
      tags: [],
    },
    {
      id: 4,
      question: "How does your solution integrate with third-party CRM platforms like Salesforce?",
      answer: "Our solution provides a native, bi-directional integration with Salesforce via a managed package available on the AppExchange. This integration syncs custom objects, standard objects, and allows for seamless data flow between the two platforms without the need for middleware.",
      category: "Product",
      compliance: "pending",
      assignee: members.find((m: any) => m.role === 'Editor') || null,
      status: 'Completed',
      tags: ['integration', 'salesforce'],
    }
];

// The data store is now an object keyed by tenantId for true multi-tenancy.
let inMemoryRfps: Record<string, RFP[]> = {};

// Seed data function to be called when needed
const initializeDemoData = () => {
    // Only initialize if the 'megacorp' tenant data doesn't exist
    if (!inMemoryRfps['megacorp']) {
        const sampleQuestions = getSampleQuestions(demoMembers);
        inMemoryRfps['megacorp'] = [
            { id: 'rfp-1', tenantId: 'megacorp', name: 'Q3 Enterprise Security RFP', status: 'In Progress', questions: sampleQuestions, topics: ['security', 'compliance', 'enterprise'] },
            { id: 'rfp-2', tenantId: 'megacorp', name: 'Project Titan Proposal', status: 'Won', questions: [sampleQuestions[3], sampleQuestions[2]], topics: ['product', 'pricing'] },
            { id: 'rfp-3', tenantId: 'megacorp', name: '2023 Compliance Audit', status: 'Lost', questions: [sampleQuestions[0], sampleQuestions[1]], topics: ['security', 'legal', 'audit'] },
        ];
    }
};

class RfpService {

    public async getRfps(tenantId: string): Promise<RFP[]> {
        initializeDemoData();
        return inMemoryRfps[tenantId] || [];
    }
    
    public async getRfp(tenantId: string, rfpId: string): Promise<RFP | undefined> {
        initializeDemoData();
        const tenantRfps = inMemoryRfps[tenantId] || [];
        return tenantRfps.find(r => r.id === rfpId);
    }

    public async updateQuestion(tenantId: string, rfpId: string, questionId: number, updates: Partial<Question>): Promise<Question | null> {
        const tenantRfps = await this.getRfps(tenantId);
        if (!tenantRfps) return null;
        
        const rfpIndex = tenantRfps.findIndex(r => r.id === rfpId);
        if (rfpIndex === -1) return null;
        
        const questionIndex = tenantRfps[rfpIndex].questions.findIndex(q => q.id === questionId);
        if (questionIndex > -1) {
            const updatedQuestion = { ...tenantRfps[rfpIndex].questions[questionIndex], ...updates };
            tenantRfps[rfpIndex].questions[questionIndex] = updatedQuestion;
            return updatedQuestion;
        }
        return null;
    }

    public async addRfp(tenantId: string, name: string, questions: Question[], topics: string[] = []): Promise<RFP> {
        if (!inMemoryRfps[tenantId]) {
            inMemoryRfps[tenantId] = [];
        }

        const newRfp: RFP = {
            id: `rfp-${Date.now()}`,
            tenantId,
            name,
            questions,
            status: 'Draft',
            topics,
        };
        
        inMemoryRfps[tenantId].unshift(newRfp);
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
        rfp.questions.push(newQuestion);
        return newQuestion;
    }
    
    public async updateRfpStatus(tenantId: string, rfpId: string, status: RfpStatus): Promise<RFP | null> {
        const tenantRfps = await this.getRfps(tenantId);
        if (!tenantRfps) return null;

        const rfpIndex = tenantRfps.findIndex(r => r.id === rfpId);
        if (rfpIndex !== -1) {
            tenantRfps[rfpIndex].status = status;
            return tenantRfps[rfpIndex];
        }
        return null;
    }
}

export const rfpService = new RfpService();
