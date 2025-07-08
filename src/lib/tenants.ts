
import { auth, currentUser } from '@clerk/nextjs/server';
import { type Tenant, type TeamMember, plansConfig, type Role } from './tenant-types';

export * from './tenant-types';

// NOTE: With Firebase removed, this service now uses a temporary in-memory store.
// Data will NOT persist across server restarts.

const getLimitsForTenant = (plan: Tenant['plan']): Tenant['limits'] => {
    return plansConfig[plan];
}

const getDemoTenant = (orgId: string): Tenant => {
    const members: TeamMember[] = [
        { id: 'user_2fJAnr9bhdC7r4bDBaQzJt0iGzJ', name: 'Alex Johnson', email: 'alex.j@megacorp.com', role: 'Owner', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 'user_2fKAnr9bhdC7r4bDBaQzJt0iGzK', name: 'Maria Garcia', email: 'maria.g@megacorp.com', role: 'Admin', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 'user_2fLAnr9bhdC7r4bDBaQzJt0iGzL', name: 'Priya Patel', email: 'priya.p@megacorp.com', role: 'Editor', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
    ];
    
    const plan = 'team';

    return {
        id: orgId, // Use the orgId
        name: 'MegaCorp (Demo)',
        subdomain: orgId,
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

// Key in-memory tenants by orgId
let inMemoryTenants: Record<string, Tenant> = {
    'megacorp': getDemoTenant('megacorp')
};


export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    
    // For the public demo, we always return the mock tenant as-is without checking auth.
    // The ID and subdomain are both 'megacorp' for simplicity.
    if (subdomain === 'megacorp') {
        return inMemoryTenants['megacorp'];
    }

    const { orgId, orgSlug, orgRole } = auth();
    const user = await currentUser();

    if (!orgId || !user || orgSlug !== subdomain) {
      // If there's no active org, or the user is not logged in, or the slug doesn't match the subdomain,
      // the user doesn't have access.
      return null;
    }

    let tenant = inMemoryTenants[orgId];
    
    // If the tenant doesn't exist in our mock store, create it on the fly.
    // This simulates what would happen when a new org is created via Clerk.
    if (!tenant) {
        const { orgName } = auth();
        const newTenant: Tenant = {
            id: orgId,
            subdomain: orgSlug,
            name: orgName || `${orgSlug}'s Workspace`,
            domains: [],
            plan: 'free',
            members: [], // will be populated next
            branding: { logoUrl: 'https://placehold.co/128x32.png', logoDataAiHint: 'company logo' },
            defaultTone: 'Formal',
            limits: getLimitsForTenant('free'),
        };
        inMemoryTenants[orgId] = newTenant;
        tenant = newTenant;
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
    const otherMembers = tenant.members.filter(m => m.id !== user.id);
    const tenantWithCurrentUser = {
        ...tenant,
        members: [currentUserMember, ...otherMembers],
    };

    // Return a deep copy to avoid modifying the in-memory store directly in components
    return JSON.parse(JSON.stringify(tenantWithCurrentUser));
}


export async function updateTenant(orgId: string, updates: Partial<Omit<Tenant, 'id' | 'subdomain' | 'limits'>>): Promise<Tenant | null> {
    if (!inMemoryTenants[orgId]) {
      // Attempt to create a tenant on the fly if it doesn't exist
      const { orgSlug } = auth();
      // This is a fallback and might not have the correct subdomain if called in a non-request context.
      const tenant = await getTenantBySubdomain(orgSlug || orgId);
      if (!tenant) return null;
    }

    inMemoryTenants[orgId] = {
        ...inMemoryTenants[orgId],
        ...updates,
    };
    // Recalculate limits if plan changed
    if (updates.plan) {
        inMemoryTenants[orgId].limits = getLimitsForTenant(updates.plan);
    }
    return inMemoryTenants[orgId];
}

    