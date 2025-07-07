
import { type Tenant, type TeamMember, plansConfig } from './tenant-types';

export * from './tenant-types';

// NOTE: With Firebase removed, this service now uses a temporary in-memory store.
// Data will NOT persist across server restarts.

const getLimitsForTenant = (plan: Tenant['plan']): Tenant['limits'] => {
    return plansConfig[plan];
}

const getDemoTenant = (subdomain: string): Tenant => {
    const members: TeamMember[] = [
        { id: 'demo-user-id', name: 'Alex Johnson', email: 'alex.j@megacorp.com', role: 'Owner', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: '2', name: 'Maria Garcia', email: 'maria.g@megacorp.com', role: 'Admin', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: '3', name: 'Priya Patel', email: 'priya.p@megacorp.com', role: 'Editor', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
    ];
    
    const plan = 'team';

    return {
        id: subdomain,
        name: 'MegaCorp (Demo)',
        subdomain: subdomain,
        domains: ['megacorp.com'],
        plan: plan,
        ssoProvider: null,
        addOns: [],
        defaultTone: 'Formal',
        branding: { logoUrl: 'https://placehold.co/128x32.png', logoDataAiHint: 'company logo' },
        limits: getLimitsForTenant(plan),
        members,
    };
};

let inMemoryTenants: Record<string, Tenant> = {
    'megacorp': getDemoTenant('megacorp')
};


export function getTenantBySubdomain(subdomain: string): Tenant | null {
    return inMemoryTenants[subdomain] || null;
}

export function updateTenant(tenantId: string, updates: Partial<Omit<Tenant, 'id' | 'subdomain' | 'limits'>>): Tenant | null {
    if (inMemoryTenants[tenantId]) {
        inMemoryTenants[tenantId] = {
            ...inMemoryTenants[tenantId],
            ...updates,
        };
        // Recalculate limits if plan changed
        if (updates.plan) {
            inMemoryTenants[tenantId].limits = getLimitsForTenant(updates.plan);
        }
        return inMemoryTenants[tenantId];
    }
    return null;
}
