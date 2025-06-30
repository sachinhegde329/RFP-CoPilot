'use server';

import type { TeamMember } from './tenants';

export type QuestionStatus = 'Unassigned' | 'In Progress' | 'Completed';
export type ComplianceStatus = "passed" | "failed" | "pending";

export interface Question {
  id: number;
  question: string;
  category: string;
  answer: string;
  compliance: ComplianceStatus;
  assignee?: TeamMember | null;
  status: QuestionStatus;
}

interface RfpData {
    questions: Question[];
}

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
      answer: "Our standard SLA guarantees 99.9% uptime for our production environment, excluding scheduled maintenance. We offer two support tiers: Standard (9-5 business hours, email support) and Premium (24/7 phone and email support with a 1-hour response time guarantee for critical issues).",
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

class RfpService {
    private tenantData: Record<string, RfpData> = {};

    constructor() {
        // Using require to avoid circular dependency issues at module load time
        const { getAllTenants } = require('./tenants'); 
        const allTenants = getAllTenants();
        for (const tenant of allTenants) {
            this._ensureTenantData(tenant.id, tenant.members);
        }
    }

    private _ensureTenantData(tenantId: string, members: TeamMember[] = []) {
        if (!this.tenantData[tenantId]) {
            this.tenantData[tenantId] = {
                questions: getSampleQuestions(members),
            };
        }
    }

    public getQuestions(tenantId: string): Question[] {
        // In a real app, this might come from a DB
        const { getTenantBySubdomain } = require('./tenants');
        const tenant = getTenantBySubdomain(tenantId);
        this._ensureTenantData(tenantId, tenant?.members);
        return this.tenantData[tenantId].questions;
    }

    public updateQuestion(tenantId: string, questionId: number, updates: Partial<Question>): Question | null {
        this._ensureTenantData(tenantId);
        const questions = this.tenantData[tenantId].questions;
        const questionIndex = questions.findIndex(q => q.id === questionId);
        if (questionIndex > -1) {
            questions[questionIndex] = { ...questions[questionIndex], ...updates };
            return questions[questionIndex];
        }
        return null;
    }

    public setQuestions(tenantId: string, questions: Question[]): Question[] {
        this._ensureTenantData(tenantId);
        this.tenantData[tenantId].questions = questions;
        return this.tenantData[tenantId].questions;
    }
    
    public addQuestion(tenantId: string, questionData: Omit<Question, 'id'>): Question {
        this._ensureTenantData(tenantId);
        const questions = this.tenantData[tenantId].questions;
        const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
        const newQuestion: Question = {
            ...questionData,
            id: newId,
        };
        questions.push(newQuestion);
        return newQuestion;
    }
}

export const rfpService = new RfpService();
