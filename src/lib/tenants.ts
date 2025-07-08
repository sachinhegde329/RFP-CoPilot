import { getSession } from '@auth0/nextjs-auth0';
import { type Tenant, type TeamMember, plansConfig, type Role } from './tenant-types';

export * from './tenant-types';

const getLimitsForTenant = (plan: Tenant['plan']): Tenant['limits'] => {
    return plansConfig[plan];
}

const getDemoTenant = (): Tenant => {
    const members: TeamMember[] = [
        { id: 'user_2fJAnr9bhdC7r4bDBaQzJt0iGzJ', name: 'Alex Johnson', email: 'alex.j@megacorp.com', role: 'Owner', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 'user_2fKAnr9bhdC7r4bDBaQzJt0iGzK', name: 'Maria Garcia', email: 'maria.g@megacorp.com', role: 'Admin', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 'user_2fLAnr9bhdC7r4bDBaQzJt0iGzL', name: 'Priya Patel', email: 'priya.p@megacorp.com', role: 'Editor', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
    ];
    
    const plan = 'team';

    return {
        id: 'megacorp', // The ID and subdomain are both 'megacorp' for the demo
        name: 'MegaCorp (Demo)',
        subdomain: 'megacorp',
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

// Key in-memory tenants by their ID (which is the subdomain for users, or 'megacorp' for demo)
let inMemoryTenants: Record<string, Tenant> = {
    'megacorp': getDemoTenant()
};


export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    
    // For the public demo, we always return the mock tenant as-is without checking auth.
    if (subdomain === 'megacorp') {
        return inMemoryTenants['megacorp'];
    }

    const session = await getSession();
    const user = session?.user;

    // If there's no active user session, deny access.
    if (!user || !user.sub) {
      return null;
    }

    // After migration to Auth0, the user's `sub` (unique ID) is their tenant ID and subdomain.
    // This check ensures a user can only access their own subdomain.
    if (user.sub !== subdomain) {
        return null;
    }

    let tenant = inMemoryTenants[user.sub];
    
    // If the tenant doesn't exist in our mock store, create it on the fly for the new user.
    if (!tenant) {
        const newTenantMember: TeamMember = {
            id: user.sub,
            name: user.name || user.email || 'New User',
            email: user.email || '',
            role: 'Owner', // The first user is the owner
            avatar: user.picture,
            status: 'Active'
        };

        const newTenant: Tenant = {
            id: user.sub,
            subdomain: user.sub,
            name: `${user.name || 'My'}'s Workspace`,
            domains: [],
            plan: 'free',
            members: [newTenantMember],
            branding: { logoUrl: 'https://placehold.co/128x32.png', logoDataAiHint: 'company logo' },
            defaultTone: 'Formal',
            limits: getLimitsForTenant('free'),
        };
        inMemoryTenants[user.sub] = newTenant;
        tenant = newTenant;
    }

    // Return a deep copy to avoid modifying the in-memory store directly in components
    return JSON.parse(JSON.stringify(tenant));
}


export async function updateTenant(tenantId: string, updates: Partial<Omit<Tenant, 'id' | 'subdomain' | 'limits'>>): Promise<Tenant | null> {
    if (!inMemoryTenants[tenantId]) {
      return null;
    }

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
