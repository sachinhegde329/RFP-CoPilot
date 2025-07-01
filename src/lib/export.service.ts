
import { getTenantBySubdomain, type Role, type TeamMember } from './tenants';
import { rfpService, type Question } from './rfp.service';

// NOTE: This service is currently using an in-memory store for prototype purposes.
// For a production environment, this should be migrated to a persistent database (e.g., Firestore).

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
        // We cannot reliably call async functions in a constructor.
        // Data seeding will need to happen on-demand when a service is called.
    }
    
    private async _ensureTenantData(tenantId: string) {
        if (!this.tenantData[tenantId]) {
            this.tenantData[tenantId] = { history: [] };
             // Seed data for megacorp demo tenant if it doesn't exist
            if (tenantId === 'megacorp' && this.tenantData[tenantId].history.length === 0) {
                const megacorpTenant = await getTenantBySubdomain('megacorp');
                if (megacorpTenant) {
                    const rfps = await rfpService.getRfps('megacorp');
                    const sampleRfp = rfps.find((r: any) => r.id === 'rfp-3');
                    if (sampleRfp) {
                        this.tenantData['megacorp'].history.push({
                            id: 'megacorp-main_rfp-1672531200000',
                            tenantId: 'megacorp',
                            rfpId: sampleRfp.id,
                            version: 'v1.0 - Initial Draft',
                            format: 'docx',
                            exportedAt: new Date('2024-07-15T10:30:00Z').toISOString(),
                            exportedBy: { id: 3, name: 'David Chen', role: 'Approver' },
                            questionCount: sampleRfp.questions.length,
                            questions: sampleRfp.questions,
                            acknowledgments: [
                                { name: 'Priya Patel', role: 'Editor', comment: 'Initial answers drafted for all sections.' },
                                { name: 'David Chen', role: 'Approver', comment: 'Reviewed and approved product-related questions.' }
                            ]
                        });
                    }
                }
            }
        }
    }

    public async addExportRecord(tenantId: string, record: Omit<ExportRecord, 'id' | 'tenantId'>): Promise<ExportRecord> {
        await this._ensureTenantData(tenantId);
        const newRecord: ExportRecord = {
            ...record,
            id: `${tenantId}-${record.rfpId}-${Date.now()}`,
            tenantId,
        };
        this.tenantData[tenantId].history.unshift(newRecord);
        return newRecord;
    }

    public async getExportHistory(tenantId: string, rfpId: string): Promise<ExportRecord[]> {
        await this._ensureTenantData(tenantId);
        return this.tenantData[tenantId].history.filter(record => record.rfpId === rfpId).sort((a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime());
    }
}

export const exportService = new ExportService();
