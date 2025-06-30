
import type { Tenant } from './tenants';

export type TemplateType = 'System' | 'Custom';
export type TemplateIcon = 'FileText' | 'FileJson' | 'Blocks';
export type TemplateSectionType = 'title' | 'header' | 'qa_by_category' | 'acknowledgments' | 'custom_text' | 'page_break';

export interface TemplateSection {
  id: string; // unique ID for react keys
  type: TemplateSectionType;
  content: string; // For custom text, titles, etc. Can contain placeholders like {{version}}.
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

interface TenantTemplateData {
    templates: Template[];
}

class TemplateService {
    private tenantData: Record<string, TenantTemplateData> = {};

    private getSystemTemplates(tenantId: string): Template[] {
        return [
            {
                id: 'system-default-categorized',
                tenantId: tenantId,
                name: "Default Categorized",
                description: "A standard template that groups questions by their assigned category (e.g., Security, Legal).",
                type: "System",
                icon: 'FileText',
                structure: [
                    { id: 's1', type: 'title', content: 'RFP Response - Version {{version}}' },
                    { id: 's2', type: 'qa_by_category', content: 'This section will be replaced by the categorized questions and answers.' },
                    { id: 's3', type: 'acknowledgments', content: 'This section will be replaced by team acknowledgments.' },
                ]
            },
            {
                id: 'system-formal-proposal',
                tenantId: tenantId,
                name: "Formal Proposal",
                description: "A professional template suitable for formal submissions, including a cover page and table of contents.",
                type: "System",
                icon: 'FileJson',
                structure: [
                     { id: 'f1', type: 'title', content: 'Request for Proposal Response' },
                     { id: 'f2', type: 'custom_text', content: ' ' },
                     { id: 'f3', type: 'header', content: 'Prepared by: {{tenantName}}' },
                     { id: 'f4', type: 'header', content: 'Date: {{currentDate}}' },
                     { id: 'f5', type: 'page_break', content: '' },
                     { id: 'f6', type: 'qa_by_category', content: 'This section will be replaced by the categorized questions and answers.' },
                     { id: 'f7', type: 'acknowledgments', content: 'This section will be replaced by team acknowledgments.' },
                ]
            }
        ];
    }
    
    private _ensureTenantData(tenantId: string) {
        if (!this.tenantData[tenantId]) {
            this.tenantData[tenantId] = { 
                templates: [...this.getSystemTemplates(tenantId)] 
            };
        }
    }

    public getTemplates(tenantId: string): Template[] {
        this._ensureTenantData(tenantId);
        return this.tenantData[tenantId].templates;
    }

    public getTemplate(tenantId: string, templateId: string): Template | undefined {
        this._ensureTenantData(tenantId);
        return this.tenantData[tenantId].templates.find(t => t.id === templateId);
    }

    public updateTemplate(tenantId: string, templateId: string, data: Partial<Pick<Template, 'name' | 'description' | 'structure'>>): Template | null {
        this._ensureTenantData(tenantId);
        const templates = this.tenantData[tenantId].templates;
        const templateIndex = templates.findIndex(t => t.id === templateId);

        if (templateIndex > -1) {
            const template = templates[templateIndex];
            if (template.type === 'System') {
                return null;
            }
            templates[templateIndex] = { ...template, ...data };
            return templates[templateIndex];
        }
        return null;
    }

    public createTemplate(tenantId: string, data: { name: string, description: string }): Template {
        this._ensureTenantData(tenantId);
        const newTemplate: Template = {
            ...data,
            id: `custom-${tenantId}-${Date.now()}`,
            tenantId,
            type: 'Custom',
            icon: 'Blocks',
            structure: [ // Default structure for new custom templates
                { id: `c1-${Date.now()}`, type: 'title', content: 'RFP Response' },
                { id: `c2-${Date.now()}`, type: 'qa_by_category', content: 'This section will be replaced by the categorized questions and answers.' },
            ],
        };
        this.tenantData[tenantId].templates.push(newTemplate);
        return newTemplate;
    }

    public duplicateTemplate(tenantId: string, templateId: string): Template | null {
        this._ensureTenantData(tenantId);
        const sourceTemplate = this.tenantData[tenantId].templates.find(t => t.id === templateId);
        if (!sourceTemplate) return null;

        const newTemplate: Template = {
            ...sourceTemplate,
            id: `custom-${tenantId}-${Date.now()}`,
            name: `${sourceTemplate.name} (Copy)`,
            type: 'Custom',
            icon: 'Blocks',
            // Ensure deep copy of structure with new IDs
            structure: sourceTemplate.structure.map(section => ({...section, id: `section-${Date.now()}-${Math.random()}`}))
        };
        this.tenantData[tenantId].templates.push(newTemplate);
        return newTemplate;
    }

    public deleteTemplate(tenantId: string, templateId: string): boolean {
        this._ensureTenantData(tenantId);
        const template = this.tenantData[tenantId].templates.find(t => t.id === templateId);
        if (!template || template.type === 'System') return false;

        this.tenantData[tenantId].templates = this.tenantData[tenantId].templates.filter(t => t.id !== templateId);
        return true;
    }
}

export const templateService = new TemplateService();

    