
import { getTenantBySubdomain } from '@/lib/tenants';
import { notFound } from 'next/navigation';
import { TenantProvider } from '@/components/providers/tenant-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = await getTenantBySubdomain(resolvedParams.tenant);
  return {
    title: tenant ? `${tenant.name} | RFP CoPilot` : 'RFP CoPilot',
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
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          {children}
        </div>
      </SidebarProvider>
    </TenantProvider>
  );
}
