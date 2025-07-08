
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { type Tenant } from '@/lib/tenant-types';
import { getTenantBySubdomain } from '@/lib/tenants';
import { TenantProvider } from '@/components/providers/tenant-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { auth } from '@clerk/nextjs/server';

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
  const { orgId } = auth();
  const tenant = await getTenantBySubdomain(params.tenant);
  
  if (!tenant) {
    notFound();
  }
  
  // Protect the route if the user is not a member of the org, except for the public demo tenant
  if (params.tenant !== 'megacorp' && tenant.id !== orgId) {
      notFound();
  }

  // The route protection is now handled by Clerk's middleware, so the AuthGuard is no longer needed here.
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
