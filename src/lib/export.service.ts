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

const inMemoryExportHistory: ExportRecord[] = [];

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
