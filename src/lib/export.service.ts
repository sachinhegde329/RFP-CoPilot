
'use server';

import type { Role } from './tenants';

export interface ExportRecord {
    id: string;
    tenantId: string;
    rfpId: string; // To support multiple RFPs in the future
    version: string;
    format: 'pdf' | 'docx';
    exportedAt: string; // ISO string
    exportedBy: {
        name: string;
        role: Role;
    };
    questionCount: number;
    acknowledgments: { name:string; role: string; comment: string; }[];
}

interface TenantExportData {
    history: ExportRecord[];
}

class ExportService {
    private tenantData: Record<string, TenantExportData> = {};

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
