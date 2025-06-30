
import type { Role, TeamMember } from './tenants';
import type { Question } from './rfp.service';

export interface ExportRecord {
    id: string;
    tenantId: string;
    rfpId: string; // To support multiple RFPs in the future
    version: string;
    format: 'pdf' | 'docx';
    exportedAt: string; // ISO string
    exportedBy: {
        id: number;
        name: string;
        role: Role;
    };
    questionCount: number;
    questions: Question[];
    acknowledgments: { name:string; role: string; comment: string; }[];
}

interface TenantExportData {
    history: ExportRecord[];
}

class ExportService {
    private tenantData: Record<string, TenantExportData> = {};

    constructor() {
        const { getTenantBySubdomain } = require('./tenants');
        const { rfpService } = require('./rfp.service');
        const megacorpTenant = getTenantBySubdomain('megacorp');
        if (megacorpTenant) {
            const sampleQuestions = rfpService.getQuestions('megacorp');
            const completedQuestions = sampleQuestions.filter((q: Question) => q.status === 'Completed');
            this._ensureTenantData('megacorp');
            if (this.tenantData['megacorp'].history.length === 0) {
                 this.tenantData['megacorp'].history.push({
                    id: 'megacorp-main_rfp-1672531200000',
                    tenantId: 'megacorp',
                    rfpId: 'main_rfp',
                    version: 'v1.0 - Initial Draft',
                    format: 'docx',
                    exportedAt: new Date('2024-07-15T10:30:00Z').toISOString(),
                    exportedBy: megacorpTenant.members.find((m: TeamMember) => m.role === 'Editor')!,
                    questionCount: completedQuestions.length,
                    questions: completedQuestions,
                    acknowledgments: [
                        { name: 'Priya Patel', role: 'Editor', comment: 'Initial answers drafted for all sections.' },
                        { name: 'David Chen', role: 'Approver', comment: 'Reviewed and approved product-related questions.' }
                    ]
                });
            }
        }
    }

    private _ensureTenantData(tenantId: string) {
        if (!this.tenantData[tenantId]) {
            this.tenantData[tenantId] = { history: [] };
        }
    }

    public addExportRecord(tenantId: string, record: Omit<ExportRecord, 'id' | 'tenantId'>): ExportRecord {
        this._ensureTenantData(tenantId);
        const newRecord: ExportRecord = {
            ...record,
            id: `${tenantId}-${record.rfpId}-${Date.now()}`,
            tenantId,
        };
        this.tenantData[tenantId].history.unshift(newRecord);
        return newRecord;
    }

    public getExportHistory(tenantId: string, rfpId: string): ExportRecord[] {
        this._ensureTenantData(tenantId);
        return this.tenantData[tenantId].history.filter(record => record.rfpId === rfpId).sort((a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime());
    }
}

export const exportService = new ExportService();
