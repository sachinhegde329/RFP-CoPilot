

export type AddOn = 'analytics' | 'customTemplates' | 'complianceValidation' | 'aiAnswerPack';
export type Role = 'Owner' | 'Admin' | 'Approver' | 'Editor' | 'Viewer';
export type MemberStatus = 'Active' | 'Pending';
export type BrandTone = 'Formal' | 'Consultative' | 'Technical';

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  status: MemberStatus;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domains: string[];
  plan: 'free' | 'starter' | 'team' | 'business' | 'enterprise';
  ssoProvider?: 'microsoft' | 'okta' | 'google' | null;
  addOns?: AddOn[];
  stripeCustomerId?: string;
  defaultTone?: BrandTone;
  branding: {
    logoUrl: string;
    logoDataAiHint: string;
  };
  limits: {
    fileSizeMb: number;
    seats: number;
    rfps: number;
    aiAnswers: number;
  };
  members: TeamMember[];
}

export const addOnsConfig: Record<AddOn, { id: AddOn; name: string; description: string; price?: number }> = {
  analytics: {
    id: 'analytics' as const,
    name: 'Advanced Analytics',
    description: 'Unlock detailed insights into your RFP process and win rates.',
    price: 49,
  },
  customTemplates: {
    id: 'customTemplates' as const,
    name: 'Custom Export Templates',
    description: 'Create and manage branded templates for polished, professional responses.',
    price: 29,
  },
  complianceValidation: {
    id: 'complianceValidation' as const,
    name: 'Compliance Validation',
    description: 'Automatically check answers against compliance standards like SOC 2 and ISO 27001.',
    price: 99,
  },
  aiAnswerPack: {
    id: 'aiAnswerPack' as const,
    name: 'AI Answer Pack',
    description: 'Get an additional 100 AI-generated answers for your RFPs.',
    price: 9,
  }
};


export const plansConfig = {
  free: { seats: 1, fileSizeMb: 2, rfps: 1, aiAnswers: 10 },
  starter: { seats: 1, fileSizeMb: 5, rfps: 5, aiAnswers: 100 },
  team: { seats: 5, fileSizeMb: 10, rfps: 25, aiAnswers: 500 },
  business: { seats: 25, fileSizeMb: 25, rfps: Infinity, aiAnswers: 2500 },
  enterprise: { seats: 50, fileSizeMb: 50, rfps: Infinity, aiAnswers: Infinity },
};

const tenants: Omit<Tenant, 'limits'>[] = [
  {
    id: 'acme',
    name: 'Acme Inc.',
    subdomain: 'acme',
    domains: ['acme.com', 'acmeinc.com'],
    plan: 'enterprise',
    ssoProvider: 'microsoft',
    addOns: ['analytics'],
    stripeCustomerId: 'cus_Pabx3EMG9pDRgI', // Replace with actual Stripe Customer ID
    defaultTone: 'Formal',
    branding: {
      logoUrl: 'https://placehold.co/128x32.png',
      logoDataAiHint: 'modern logo',
    },
    members: [
      { id: 1, name: 'Alice (Owner)', email: 'alice@acme.com', role: 'Owner', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
      { id: 2, name: 'Bob (Admin)', email: 'bob@acme.com', role: 'Admin', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
    ],
  },
  {
    id: 'megacorp',
    name: 'MegaCorp (Demo)',
    subdomain: 'megacorp',
    domains: ['megacorp.com'],
    plan: 'team', // Updated from free to show seat limits
    ssoProvider: null,
    addOns: [],
    stripeCustomerId: 'cus_Paby6e5S6f6Kj3', // Replace with actual Stripe Customer ID
    defaultTone: 'Consultative',
    branding: {
      logoUrl: 'https://placehold.co/128x32.png',
      logoDataAiHint: 'corporate logo',
    },
    members: [
        { id: 1, name: 'Alex Johnson', email: 'alex.j@megacorp.com', role: 'Owner', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 2, name: 'Maria Garcia', email: 'maria.g@megacorp.com', role: 'Admin', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 3, name: 'David Chen', email: 'david.c@megacorp.com', role: 'Approver', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 4, name: 'Priya Patel', email: 'priya.p@megacorp.com', role: 'Editor', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 5, name: 'John Smith', email: 'john.s@megacorp.com', role: 'Viewer', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
        { id: 6, name: 'sara.k@example.com', email: 'sara.k@example.com', role: 'Editor', avatar: null, status: 'Pending' },
    ],
  },
];

// Special case for specific enterprise tenants with custom limits
const customEnterpriseLimits: Record<string, { seats: number; fileSizeMb: number; rfps: number; aiAnswers: number; }> = {
    'acme': { seats: 75, fileSizeMb: 100, rfps: Infinity, aiAnswers: Infinity }
};


const freeEmailProviders = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'live.com',
  'msn.com',
]);

function createFreeTenant(subdomain: string, email: string): Tenant {
  // Sanitize subdomain to be URL-friendly
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const name = sanitizedSubdomain.split(/[-._]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return {
    id: sanitizedSubdomain,
    name: `${name}'s Workspace`,
    subdomain: sanitizedSubdomain,
    domains: [], // Personal emails don't have a shared corporate domain
    plan: 'starter', // Auto-start free trial on Starter plan
    ssoProvider: null,
    addOns: [],
    stripeCustomerId: `cus_sample_${sanitizedSubdomain}`, // Placeholder
    defaultTone: 'Formal',
    branding: {
      logoUrl: 'https://placehold.co/128x32.png',
      logoDataAiHint: 'generic logo',
    },
    limits: plansConfig.starter,
    members: [
        { id: 1, name: name, email: email, role: 'Owner', avatar: null, status: 'Active' }
    ]
  };
}

function getLimitsForTenant(tenantData: Omit<Tenant, 'limits'>): { seats: number; fileSizeMb: number; rfps: number; aiAnswers: number; } {
    if (tenantData.plan === 'enterprise') {
        // Use custom limits if they exist, otherwise fall back to the default enterprise plan config
        return customEnterpriseLimits[tenantData.id] || plansConfig.enterprise;
    }
    return plansConfig[tenantData.plan];
}

export function updateTenant(tenantId: string, updates: Partial<Omit<Tenant, 'limits'>>) {
    const tenantIndex = tenants.findIndex(t => t.id === tenantId);
    if (tenantIndex > -1) {
        tenants[tenantIndex] = { ...tenants[tenantIndex], ...updates };
        return tenants[tenantIndex];
    }
    return null;
}

export function inviteMember(tenantId: string, email: string, role: Role): TeamMember | null {
  const tenantIndex = tenants.findIndex(t => t.id === tenantId);
  if (tenantIndex === -1) return null;

  const tenant = tenants[tenantIndex];
  if (tenant.members.find(m => m.email === email)) {
    // Member already exists
    return null;
  }
  
  const newId = Math.max(0, ...tenant.members.map(m => m.id)) + 1;
  const newMember: TeamMember = {
    id: newId,
    email: email,
    name: email, // use email as name for pending invite
    role,
    status: 'Pending',
    avatar: null
  };

  tenant.members.push(newMember);
  return newMember;
}

export function removeMember(tenantId: string, memberId: number): boolean {
    const tenantIndex = tenants.findIndex(t => t.id === tenantId);
    if (tenantIndex === -1) return false;

    const tenant = tenants[tenantIndex];
    const memberIndex = tenant.members.findIndex(m => m.id === memberId);
    
    if (memberIndex > -1 && tenant.members[memberIndex].role !== 'Owner') {
        tenant.members.splice(memberIndex, 1);
        return true;
    }
    return false;
}

export function updateMemberRole(tenantId: string, memberId: number, newRole: Role): TeamMember | null {
    const tenantIndex = tenants.findIndex(t => t.id === tenantId);
    if (tenantIndex === -1) return null;
    
    const tenant = tenants[tenantIndex];
    const memberIndex = tenant.members.findIndex(m => m.id === memberId);

    if (memberIndex > -1 && tenant.members[memberIndex].role !== 'Owner') {
        tenant.members[memberIndex].role = newRole;
        return tenant.members[memberIndex];
    }
    return null;
}

export function updateMemberProfile(tenantId: string, memberId: number, data: Partial<Pick<TeamMember, 'name'>>): TeamMember | null {
    const tenantIndex = tenants.findIndex(t => t.id === tenantId);
    if (tenantIndex === -1) return null;

    const tenant = tenants[tenantIndex];
    const memberIndex = tenant.members.findIndex(m => m.id === memberId);

    if (memberIndex > -1) {
        tenant.members[memberIndex] = { ...tenant.members[memberIndex], ...data };
        return tenant.members[memberIndex];
    }
    return null;
}


export function getTenantBySubdomain(subdomain: string): Tenant | null {
  const tenantData = tenants.find((t) => t.subdomain === subdomain);
  if (tenantData) {
    return {
        ...tenantData,
        limits: getLimitsForTenant(tenantData)
    };
  }
  // This case should ideally not be hit directly if all access is via email login first.
  // It's a fallback to create a tenant from a subdomain.
  return createFreeTenant(subdomain, `${subdomain}@example.com`);
}

export function getTenantByEmail(email: string): Tenant | null {
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  
  const [localPart, domain] = parts;
  const domainLower = domain.toLowerCase();

  // Check for existing corporate tenants first
  const existingTenantData = tenants.find((t) => t.domains.includes(domainLower));
  if (existingTenantData) {
    return {
        ...existingTenantData,
        limits: getLimitsForTenant(existingTenantData)
    };
  }

  // If not a known corporate domain, create a new personal tenant
  // regardless of the email provider.
  const subdomain = freeEmailProviders.has(domainLower) ? localPart : domainLower.split('.')[0];
  return createFreeTenant(subdomain, email);
}


export function getAllTenants(): Tenant[] {
    return tenants.map(t => ({
      ...t,
      limits: getLimitsForTenant(t)
  }));
}
