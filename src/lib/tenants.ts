export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domains: string[];
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
    branding: {
      logoUrl: 'https://placehold.co/128x32.png',
      logoDataAiHint: 'corporate logo',
    },
  },
];

export function getTenantBySubdomain(subdomain: string): Tenant | null {
  return tenants.find((t) => t.subdomain === subdomain) || null;
}

export function getTenantByEmail(email: string): Tenant | null {
  const domain = email.split('@')[1];
  if (!domain) return null;
  return tenants.find((t) => t.domains.includes(domain)) || null;
}

export function getAllTenants(): Tenant[] {
  return tenants;
}
