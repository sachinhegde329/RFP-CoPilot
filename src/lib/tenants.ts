
import { auth, currentUser } from '@clerk/nextjs/server';
import { type Tenant, type TeamMember, plansConfig, type Role } from './tenant-types';

export * from './tenant-types';

// NOTE: With Firebase removed, this service now uses a temporary in-memory store.
// Data will NOT persist across server restarts.

const getLimitsForTenant = (plan: Tenant['plan']): Tenant['limits'] => {
    return plansConfig[plan];
}

const getDemoTenant = (subdomain: string): Tenant => {
    const members: TeamMember[] = [
        { id: 'user_2fJAnr9bhdC7r4bDBaQzJt0iGzJ', name: 'Alex Johnson', email: 'alex.j@megacorp.com', role: 'Owner', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 'user_2fKAnr9bhdC7r4bDBaQzJt0iGzK', name: 'Maria Garcia', email: 'maria.g@megacorp.com', role: 'Admin', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 'user_2fLAnr9bhdC7r4bDBaQzJt0iGzL', name: 'Priya Patel', email: 'priya.p@megacorp.com', role: 'Editor', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
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


export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    
    // For the public demo, we always return the mock tenant as-is without checking auth.
    if (subdomain === 'megacorp') {
        return inMemoryTenants['megacorp'];
    }

    let tenant = inMemoryTenants[subdomain];
    
    // If the tenant doesn't exist in our mock store, create it on the fly.
    // This simulates what would happen when a new org is created via Clerk.
    if (!tenant) {
        const { orgSlug, orgName } = auth();
        if (orgSlug === subdomain) {
             const newTenant: Tenant = {
                id: orgSlug,
                subdomain: orgSlug,
                name: orgName || `${orgSlug}'s Workspace`,
                domains: [],
                plan: 'free',
                members: [], // will be populated next
                branding: { logoUrl: 'https://placehold.co/128x32.png', logoDataAiHint: 'company logo' },
                defaultTone: 'Formal',
                limits: getLimitsForTenant('free'),
            };
            inMemoryTenants[subdomain] = newTenant;
            tenant = newTenant;
        }
    }

    if (!tenant) {
        return null;
    }
    
    // Fetch the current user from Clerk
    const user = await currentUser();
    const { orgRole } = auth();
    
    if (!user || !orgRole) {
        // Not authenticated for this org, return tenant without the user.
        // The auth guard will handle redirection.
        return tenant;
    }
    
    // Map Clerk role to application role
    const appRole: Role = orgRole === 'admin' ? 'Owner' : 'Editor';

    const currentUserMember: TeamMember = {
        id: user.id,
        name: user.fullName || user.emailAddresses[0].emailAddress,
        email: user.emailAddresses[0].emailAddress,
        role: appRole,
        avatar: user.imageUrl,
        status: 'Active'
    };
    
    // Make the current user the first member in the array for easy access
    // This is a prototype simplification. A real app would manage the full member list from a database.
    const tenantWithCurrentUser = {
        ...tenant,
        members: [currentUserMember],
    };

    // Return a deep copy to avoid modifying the in-memory store directly in components
    return JSON.parse(JSON.stringify(tenantWithCurrentUser));
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
