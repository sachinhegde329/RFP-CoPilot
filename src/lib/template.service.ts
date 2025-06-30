
'use server';

import type { Tenant } from './tenants';

export type TemplateType = 'System' | 'Custom';

export type TemplateIcon = 'FileText' | 'FileJson' | 'Blocks';

export interface Template {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: TemplateType;
  icon: TemplateIcon;
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
            },
            {
                id: 'system-formal-proposal',
                tenantId: tenantId,
                name: "Formal Proposal",
                description: "A professional template suitable for formal submissions, including a cover page and table of contents.",
                type: "System",
                icon: 'FileJson',
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

    public createTemplate(tenantId: string, data: { name: string, description: string }): Template {
        this._ensureTenantData(tenantId);
        const newTemplate: Template = {
            ...data,
            id: `custom-${tenantId}-${Date.now()}`,
            tenantId,
            type: 'Custom',
            icon: 'Blocks',
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
