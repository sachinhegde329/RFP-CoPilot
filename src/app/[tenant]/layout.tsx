
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { type Tenant } from '@/lib/tenant-types';
import { getTenantBySubdomain } from '@/lib/tenants';
import { TenantProvider } from '@/components/providers/tenant-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';

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
  const tenant = await getTenantBySubdomain(params.tenant);
  
  if (!tenant) {
    notFound();
  }

  return (
    <TenantProvider tenant={tenant}>
      <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-screen">
          <AppSidebar />
          {children}
        </div>
      </SidebarProvider>
    </TenantProvider>
  );
}
