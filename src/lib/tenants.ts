export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domains: string[];
  plan: 'free' | 'starter' | 'growth' | 'enterprise';
  branding: {
    logoUrl: string;
    logoDataAiHint: string;
  };
}

const tenants: Tenant[] = [
  {
    id: 'acme',
    name: 'Acme Inc.',
    subdomain: 'acme',
    domains: ['acme.com', 'acmeinc.com'],
    plan: 'growth',
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
    branding: {
      logoUrl: 'https://placehold.co/128x32.png',
      logoDataAiHint: 'corporate logo',
    },
  },
];

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
    branding: {
      logoUrl: 'https://placehold.co/128x32.png',
      logoDataAiHint: 'generic logo',
    },
  };
}

export function getTenantBySubdomain(subdomain: string): Tenant | null {
  const tenant = tenants.find((t) => t.subdomain === subdomain);
  if (tenant) {
    return tenant;
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
  const existingTenant = tenants.find((t) => t.domains.includes(domainLower));
  if (existingTenant) {
    return existingTenant;
  }

  // For a new corporate domain, create a tenant from the domain name
  const subdomain = domainLower.split('.')[0];
  return createFreeTenant(subdomain);
}


export function getAllTenants(): Tenant[] {
  return tenants;
}
