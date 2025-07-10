
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { type Tenant } from '@/lib/tenant-types';
import { getTenantBySubdomain } from '@/lib/tenants';
import { TenantProvider } from '@/components/providers/tenant-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { getSession } from '@auth0/nextjs-auth0';

export async function generateMetadata({ params }: { params: { tenant: string } }): Promise<Metadata> {
  const { tenant: tenantSubdomain } = params;
  const tenant = await getTenantBySubdomain(tenantSubdomain);
  if (!tenant) {
    return {
      title: 'Not Found'
    };
  }
  return {
    title: `${tenant.name} | RFP CoPilot`,
  };
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  let session;
  // Check if Auth0 environment variables are set before trying to get a session.
  // This prevents a server crash in environments where secrets are not configured.
  if (process.env.AUTH0_SECRET && process.env.AUTH0_BASE_URL && process.env.AUTH0_ISSUER_BASE_URL && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET) {
    session = await getSession();
  }

  const { tenant: tenantSubdomain } = params;
  const tenant = await getTenantBySubdomain(tenantSubdomain);
  
  if (!tenant) {
    notFound();
  }
  
  // For non-demo tenants, user must be logged in. Middleware should handle redirect, but this is a failsafe.
  if (tenantSubdomain !== 'megacorp' && !session?.user) {
      notFound();
  }

  // After Auth0 migration, the tenancy model is user-centric. The user's ID must match the tenant ID.
  if (tenantSubdomain !== 'megacorp' && tenant.id !== session?.user?.sub) {
      notFound();
  }

  // The route protection is now handled by middleware.
  return (
    <TenantProvider tenant={tenant}>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        {children}
      </SidebarProvider>
    </TenantProvider>
  );
}
