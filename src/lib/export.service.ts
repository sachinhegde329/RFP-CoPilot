import type { Role } from './tenant-types';
import type { Question } from './rfp-types';

// NOTE: With Firebase removed, this service now uses a temporary in-memory store.
// Data will NOT persist across server restarts.

export interface ExportRecord {
    id: string;
    tenantId: string;
    rfpId: string;
    rfpName: string;
    version: string;
    format: 'pdf' | 'docx';
    exportedAt: string; // ISO string
    exportedBy: {
        id: string;
        name: string;
        role: Role;
    };
    questionCount: number;
    questions: Question[];
    acknowledgments: { name:string; role: string; comment: string; }[];
}

const demoQuestions: Question[] = [
    {
        id: 1,
        question: "What is your data retention policy, and how do you ensure customer data is securely deleted upon request?",
        answer: "Our data retention policy adheres to industry best practices, retaining customer data for the duration of the contract plus an additional 90 days for recovery purposes. Upon a verified request, data is securely deleted from all active and backup systems using a 3-pass overwrite method to ensure it is irrecoverable.",
        category: "Security",
        compliance: "passed",
        status: 'Completed',
        tags: ['GDPR', 'data-security', 'deletion'],
    },
    {
        id: 2,
        question: "Can you describe your Service Level Agreement (SLA) for production uptime and provide details on support tiers?",
        answer: "Our standard SLA guarantees 99.9% uptime for our production environment, excluding scheduled maintenance. We offer two support tiers: Standard (9-5 business hours, email support) and Premium (24/7 phone and email support with a 1-hour response time for critical issues).",
        category: "Legal",
        compliance: "passed",
        status: 'Completed',
        tags: ['SLA', 'support'],
    }
];

const inMemoryExportHistory: ExportRecord[] = [
    {
        id: 'export-demo-1',
        tenantId: 'megacorp',
        rfpId: 'rfp-1',
        rfpName: 'Q3 Enterprise Security RFP',
        version: 'v1.0 Final',
        format: 'docx',
        exportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        exportedBy: {
            id: 'demo-user-id',
            name: 'Alex Johnson',
            role: 'Owner'
        },
        questionCount: demoQuestions.length,
        questions: demoQuestions,
        acknowledgments: [
            { name: 'Maria Garcia', role: 'Legal Review', comment: 'Approved for submission.' }
        ]
    },
    {
        id: 'export-demo-2',
        tenantId: 'megacorp',
        rfpId: 'rfp-1',
        rfpName: 'Q3 Enterprise Security RFP',
        version: 'v0.9 Draft',
        format: 'pdf',
        exportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        exportedBy: {
            id: '3',
            name: 'Priya Patel',
            role: 'Editor'
        },
        questionCount: demoQuestions.length,
        questions: demoQuestions,
        acknowledgments: [],
    },
    {
        id: 'export-demo-3',
        tenantId: 'megacorp',
        rfpId: 'rfp-2',
        rfpName: 'Project Titan Proposal',
        version: 'v1.0',
        format: 'docx',
        exportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        exportedBy: {
            id: 'demo-user-id',
            name: 'Alex Johnson',
            role: 'Owner'
        },
        questionCount: 2,
        questions: demoQuestions,
        acknowledgments: [
            { name: 'Alex Johnson', role: 'Final Review', comment: 'Looks good.' }
        ]
    }
];


class ExportService {

    public async addExportRecord(tenantId: string, record: Omit<ExportRecord, 'id' | 'tenantId'>): Promise<ExportRecord> {
        const newRecord: ExportRecord = {
            ...record,
            id: `export-${Date.now()}`,
            tenantId,
        };
        inMemoryExportHistory.push(newRecord);
        return newRecord;
    }

    public async getExportHistory(tenantId: string, rfpId?: string): Promise<ExportRecord[]> {
        const history = inMemoryExportHistory
            .filter(r => {
                if (rfpId) {
                    return r.tenantId === tenantId && r.rfpId === rfpId
                }
                return r.tenantId === tenantId;
            })
            .sort((a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime());
        return history;
    }
}

export const exportService = new ExportService();
