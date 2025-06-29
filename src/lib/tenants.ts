
export type AddOn = 'analytics' | 'customTemplates' | 'complianceValidation';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domains: string[];
  plan: 'free' | 'starter' | 'growth' | 'enterprise';
  addOns?: AddOn[];
  branding: {
    logoUrl: string;
    logoDataAiHint: string;
  };
  limits: {
    fileSizeMb: number;
    seats: number;
  };
}

export const addOnsConfig = {
  analytics: {
    id: 'analytics' as const,
    name: 'Advanced Analytics',
    description: 'Unlock detailed insights into your RFP process and win rates.',
  },
  customTemplates: {
    id: 'customTemplates' as const,
    name: 'Custom Export Templates',
    description: 'Create and manage branded templates for polished, professional responses.',
  },
  complianceValidation: {
    id: 'complianceValidation' as const,
    name: 'Compliance Validation',
    description: 'Automatically check answers against compliance standards like SOC 2 and ISO 27001.',
  }
};


export const plansConfig = {
  free: { seats: 2, fileSizeMb: 2 },
  starter: { seats: 5, fileSizeMb: 5 },
  growth: { seats: 25, fileSizeMb: 10 },
  enterprise: { seats: 50, fileSizeMb: 50 },
};

const tenants: Omit<Tenant, 'limits'>[] = [
  {
    id: 'acme',
    name: 'Acme Inc.',
    subdomain: 'acme',
    domains: ['acme.com', 'acmeinc.com'],
    plan: 'enterprise',
    addOns: [],
    branding: {
      logoUrl: 'https://placehold.co/128x32.png',
      logoDataAiHint: 'modern logo',
    },
  },
  {
    id: 'megacorp',
    name: 'MegaCorp',
    subdomain: 'megacorp',
    domains: ['megacorp.com'],
    plan: 'free',
    addOns: [],
    branding: {
      logoUrl: 'https://placehold.co/128x32.png',
      logoDataAiHint: 'corporate logo',
    },
  },
];

// Special case for specific enterprise tenants with custom limits
const customEnterpriseLimits: Record<string, { seats: number; fileSizeMb: number; }> = {
    'acme': { seats: 75, fileSizeMb: 100 }
};


const freeEmailProviders = new Set([
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'live.com',
  'msn.com',
]);

function createFreeTenant(subdomain: string): Tenant {
  // Sanitize subdomain to be URL-friendly
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const name = sanitizedSubdomain.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return {
    id: sanitizedSubdomain,
    name: `${name}`,
    subdomain: sanitizedSubdomain,
    domains: [`${sanitizedSubdomain}.com`], // Best guess for domain
    plan: 'free',
    addOns: [],
    branding: {
      logoUrl: 'https://placehold.co/128x32.png',
      logoDataAiHint: 'generic logo',
    },
    limits: plansConfig.free,
  };
}

function getLimitsForTenant(tenantData: Omit<Tenant, 'limits'>): { seats: number; fileSizeMb: number; } {
    if (tenantData.plan === 'enterprise') {
        // Use custom limits if they exist, otherwise fall back to the default enterprise plan config
        return customEnterpriseLimits[tenantData.id] || plansConfig.enterprise;
    }
    return plansConfig[tenantData.plan];
}

export function getTenantBySubdomain(subdomain: string): Tenant | null {
  const tenantData = tenants.find((t) => t.subdomain === subdomain);
  if (tenantData) {
    return {
        ...tenantData,
        limits: getLimitsForTenant(tenantData)
    };
  }
  // If no hardcoded tenant, assume it's a new free tenant being accessed.
  return createFreeTenant(subdomain);
}

export function getTenantByEmail(email: string): Tenant | null {
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  
  const [localPart, domain] = parts;
  const domainLower = domain.toLowerCase();

  // For testing purposes, treat gmail.com as a special case where the user's name is the subdomain
  if (domainLower === 'gmail.com') {
    return createFreeTenant(localPart);
  }

  // Block other free email providers
  if (freeEmailProviders.has(domainLower)) {
    return null;
  }

  // Check for existing corporate tenants
  const existingTenantData = tenants.find((t) => t.domains.includes(domainLower));
  if (existingTenantData) {
    return {
        ...existingTenantData,
        limits: getLimitsForTenant(existingTenantData)
    };
  }

  // For a new corporate domain, create a tenant from the domain name
  const subdomain = domainLower.split('.')[0];
  return createFreeTenant(subdomain);
}


export function getAllTenants(): Tenant[] {
    return tenants.map(t => ({
      ...t,
      limits: getLimitsForTenant(t)
  }));
}
