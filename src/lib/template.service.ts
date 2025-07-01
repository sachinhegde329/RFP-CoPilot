
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

// NOTE: This service is now migrated to use Firestore for data persistence.

export type TemplateType = 'System' | 'Custom';
export type TemplateIcon = 'FileText' | 'FileJson' | 'Blocks';
export type TemplateSectionType = 'title' | 'header' | 'qa_list_by_category' | 'acknowledgments' | 'custom_text' | 'page_break';

export interface TemplateSection {
  id: string; // unique ID for react keys
  type: TemplateSectionType;
  content: string; 
}

export interface Template {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: TemplateType;
  icon: TemplateIcon;
  structure: TemplateSection[];
}

function sanitizeData<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
}

class TemplateService {
    private getTemplatesCollection(tenantId: string) {
        return collection(db, 'tenants', tenantId, 'templates');
    }

    private getSystemTemplates(tenantId: string): Template[] {
        return [
            {
                id: 'system-default-categorized',
                tenantId: tenantId,
                name: "Default Categorized",
                description: "A standard template that groups questions by their assigned category.",
                type: "System",
                icon: 'FileText',
                structure: [
                    { id: 's1', type: 'title', content: 'RFP Response - Version {{version}}' },
                    { id: 's2', type: 'custom_text', content: 'This document was prepared by {{tenantName}} on {{currentDate}}.' },
                    { id: 's3', type: 'qa_list_by_category', content: 'Security' },
                    { id: 's4', type: 'qa_list_by_category', content: 'Legal' },
                    { id: 's5', type: 'qa_list_by_category', content: 'Product' },
                    { id: 's6', type: 'qa_list_by_category', content: 'Pricing' },
                    { id: 's7', type: 'qa_list_by_category', content: 'Company' },
                    { id: 's8', type: 'qa_list_by_category', content: '*' },
                    { id: 's9', type: 'acknowledgments', content: '' },
                ]
            },
            {
                id: 'system-formal-proposal',
                tenantId: tenantId,
                name: "Formal Proposal",
                description: "A professional template suitable for formal submissions, including a cover page.",
                type: "System",
                icon: 'FileJson',
                structure: [
                     { id: 'f1', type: 'title', content: 'Request for Proposal Response' },
                     { id: 'f2', type: 'custom_text', content: '' },
                     { id: 'f3', type: 'header', content: 'Prepared by: {{tenantName}}' },
                     { id: 'f4', type: 'header', content: 'Date: {{currentDate}}' },
                     { id: 'f5', type: 'page_break', content: '' },
                     { id: 'f6', type: 'qa_list_by_category', content: 'Product' },
                     { id: 'f7', type: 'qa_list_by_category', content: 'Security' },
                     { id: 'f8', type: 'qa_list_by_category', content: '*' },
                     { id: 'f9', type: 'acknowledgments', content: '' },
                ]
            }
        ];
    }

    public async getTemplates(tenantId: string): Promise<Template[]> {
        const systemTemplates = this.getSystemTemplates(tenantId);
        const templatesSnapshot = await getDocs(this.getTemplatesCollection(tenantId));
        const customTemplates = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
        return sanitizeData([...systemTemplates, ...customTemplates]);
    }

    public async getTemplate(tenantId: string, templateId: string): Promise<Template | undefined> {
        if (templateId.startsWith('system-')) {
            return this.getSystemTemplates(tenantId).find(t => t.id === templateId);
        }
        const templateDoc = await getDoc(doc(this.getTemplatesCollection(tenantId), templateId));
        if (!templateDoc.exists()) return undefined;
        return sanitizeData({ id: templateDoc.id, ...templateDoc.data() } as Template);
    }

    public async updateTemplate(tenantId: string, templateId: string, data: Partial<Pick<Template, 'name' | 'description' | 'structure'>>): Promise<Template | null> {
        const templateRef = doc(this.getTemplatesCollection(tenantId), templateId);
        const templateSnap = await getDoc(templateRef);
        if (!templateSnap.exists() || (templateSnap.data() as Template).type === 'System') {
            return null;
        }
        await updateDoc(templateRef, data);
        const updatedDoc = await getDoc(templateRef);
        return sanitizeData({ id: updatedDoc.id, ...updatedDoc.data() } as Template);
    }

    public async createTemplate(tenantId: string, data: { name: string, description: string }): Promise<Template> {
        const newTemplateData: Omit<Template, 'id'> = {
            ...data,
            tenantId,
            type: 'Custom',
            icon: 'Blocks',
            structure: [
                { id: `c1-${Date.now()}`, type: 'title', content: 'RFP Response' },
                { id: `c2-${Date.now()}`, type: 'qa_list_by_category', content: '*' },
            ],
        };
        const newTemplateRef = await addDoc(this.getTemplatesCollection(tenantId), newTemplateData);
        return { ...newTemplateData, id: newTemplateRef.id };
    }

    public async duplicateTemplate(tenantId: string, templateId: string): Promise<Template | null> {
        const sourceTemplate = await this.getTemplate(tenantId, templateId);
        if (!sourceTemplate) return null;

        const newTemplateData: Omit<Template, 'id'> = {
            ...sourceTemplate,
            name: `${sourceTemplate.name} (Copy)`,
            type: 'Custom',
            icon: 'Blocks',
            structure: sourceTemplate.structure.map(section => ({...section, id: `section-${Date.now()}-${Math.random()}`}))
        };
        
        const newTemplateRef = await addDoc(this.getTemplatesCollection(tenantId), newTemplateData);
        return { ...newTemplateData, id: newTemplateRef.id };
    }

    public async deleteTemplate(tenantId: string, templateId: string): Promise<boolean> {
        const template = await this.getTemplate(tenantId, templateId);
        if (!template || template.type === 'System') return false;

        await deleteDoc(doc(this.getTemplatesCollection(tenantId), templateId));
        return true;
    }
}

export const templateService = new TemplateService();
