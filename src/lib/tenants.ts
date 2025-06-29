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
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'live.com',
  'msn.com',
]);

function createFreeTenant(domainOrSubdomain: string, type: 'domain' | 'subdomain'): Tenant {
  let subdomain, domain, name;

  if (type === 'domain') {
    domain = domainOrSubdomain;
    subdomain = domain.split('.')[0];
  } else { // type === 'subdomain'
    subdomain = domainOrSubdomain;
    domain = `${subdomain}.com`; // Make an assumption for the domain
  }
  
  // Capitalize first letter of each part of the subdomain
  name = subdomain.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return {
    id: subdomain,
    name: `${name}`,
    subdomain: subdomain,
    domains: [domain],
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
  return createFreeTenant(subdomain, 'subdomain');
}

export function getTenantByEmail(email: string): Tenant | null {
  const domain = email.split('@')[1];
  if (!domain) return null;
  
  if (freeEmailProviders.has(domain.toLowerCase())) {
    return null;
  }

  const tenant = tenants.find((t) => t.domains.includes(domain));
  if (tenant) {
    return tenant;
  }

  // If no tenant for this domain, create a new free one on the fly.
  return createFreeTenant(domain, 'domain');
}

export function getAllTenants(): Tenant[] {
  return tenants;
}
