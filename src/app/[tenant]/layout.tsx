
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { type Tenant } from '@/lib/tenant-types';
import { getTenantBySubdomain } from '@/lib/tenants';
import { TenantProvider } from '@/components/providers/tenant-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { getSession } from '@auth0/nextjs-auth0';

export async function generateMetadata({ params }: { params: { tenant: string } }): Promise<Metadata> {
  const tenant = await getTenantBySubdomain(params.tenant);
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
  const session = await getSession();
  const tenant = await getTenantBySubdomain(params.tenant);
  
  if (!tenant) {
    notFound();
  }
  
  // For non-demo tenants, user must be logged in. Middleware should handle redirect, but this is a failsafe.
  if (params.tenant !== 'megacorp' && !session?.user) {
      notFound();
  }

  // After Auth0 migration, the tenancy model is user-centric. The user's ID must match the tenant ID.
  if (params.tenant !== 'megacorp' && tenant.id !== session?.user?.sub) {
      notFound();
  }

  // The route protection is now handled by middleware.
  return (
    <TenantProvider tenant={tenant}>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen">
          <AppSidebar />
          {children}
        </div>
      </SidebarProvider>
    </TenantProvider>
  );
}
