

// NOTE: With Firebase removed, this service now uses an in-memory store
// for custom templates, which will not persist. System templates are hardcoded.

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

let inMemoryCustomTemplates: Record<string, Template[]> = {};

class TemplateService {
    
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
        const customTemplates = inMemoryCustomTemplates[tenantId] || [];
        return [...systemTemplates, ...customTemplates];
    }

    public async getTemplate(tenantId: string, templateId: string): Promise<Template | undefined> {
        if (templateId.startsWith('system-')) {
            return this.getSystemTemplates(tenantId).find(t => t.id === templateId);
        }
        const customTemplates = inMemoryCustomTemplates[tenantId] || [];
        return customTemplates.find(t => t.id === templateId);
    }

    public async updateTemplate(tenantId: string, templateId: string, data: Partial<Pick<Template, 'name' | 'description' | 'structure'>>): Promise<Template | null> {
        const tenantTemplates = inMemoryCustomTemplates[tenantId];
        if (tenantTemplates) {
            const templateIndex = tenantTemplates.findIndex(t => t.id === templateId);
            if (templateIndex > -1) {
                tenantTemplates[templateIndex] = { ...tenantTemplates[templateIndex], ...data };
                return tenantTemplates[templateIndex];
            }
        }
        return null; // Can't update system templates or non-existent templates
    }

    public async createTemplate(tenantId: string, data: { name: string, description: string }): Promise<Template> {
        if (!inMemoryCustomTemplates[tenantId]) {
            inMemoryCustomTemplates[tenantId] = [];
        }
        const newTemplate: Template = {
            ...data,
            id: `custom-${Date.now()}`,
            tenantId,
            type: 'Custom',
            icon: 'Blocks',
            structure: [
                { id: `c1-${Date.now()}`, type: 'title', content: 'RFP Response' },
                { id: `c2-${Date.now()}`, type: 'qa_list_by_category', content: '*' },
            ],
        };
        inMemoryCustomTemplates[tenantId].push(newTemplate);
        return newTemplate;
    }

    public async duplicateTemplate(tenantId: string, templateId: string): Promise<Template | null> {
        const sourceTemplate = await this.getTemplate(tenantId, templateId);
        if (!sourceTemplate) return null;
        
        if (!inMemoryCustomTemplates[tenantId]) {
            inMemoryCustomTemplates[tenantId] = [];
        }

        const newTemplate: Template = {
            ...sourceTemplate,
            id: `custom-${Date.now()}`,
            name: `${sourceTemplate.name} (Copy)`,
            type: 'Custom',
            icon: 'Blocks',
            structure: sourceTemplate.structure.map(section => ({...section, id: `section-${Date.now()}-${Math.random()}`}))
        };
        
        inMemoryCustomTemplates[tenantId].push(newTemplate);
        return newTemplate;
    }

    public async deleteTemplate(tenantId: string, templateId: string): Promise<boolean> {
        const tenantTemplates = inMemoryCustomTemplates[tenantId];
        if (tenantTemplates) {
            const templateIndex = tenantTemplates.findIndex(t => t.id === templateId);
            if (templateIndex > -1) {
                tenantTemplates.splice(templateIndex, 1);
                return true;
            }
        }
        return false; // Can't delete system templates
    }
}

export const templateService = new TemplateService();
