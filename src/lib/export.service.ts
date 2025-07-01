
import { collection, doc, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { Role, TeamMember } from './tenants';
import type { Question } from './rfp.service';

// NOTE: This service is now migrated to use Firestore for data persistence.

export interface ExportRecord {
    id: string;
    tenantId: string;
    rfpId: string;
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

function sanitizeData<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
}

class ExportService {
    private getExportsCollection(tenantId: string, rfpId: string) {
        return collection(db, 'tenants', tenantId, 'rfps', rfpId, 'exports');
    }

    public async addExportRecord(tenantId: string, record: Omit<ExportRecord, 'id' | 'tenantId'>): Promise<ExportRecord> {
        const exportsCollection = this.getExportsCollection(tenantId, record.rfpId);
        const newRecordRef = await addDoc(exportsCollection, record);
        
        const newRecord: ExportRecord = {
            ...record,
            id: newRecordRef.id,
            tenantId,
        };
        return newRecord;
    }

    public async getExportHistory(tenantId: string, rfpId: string): Promise<ExportRecord[]> {
        const exportsCollection = this.getExportsCollection(tenantId, rfpId);
        const q = query(exportsCollection, orderBy('exportedAt', 'desc'));
        const snapshot = await getDocs(q);
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExportRecord));
        return sanitizeData(history);
    }
}

export const exportService = new ExportService();
