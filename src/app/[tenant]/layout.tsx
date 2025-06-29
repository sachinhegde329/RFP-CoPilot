import { getTenantBySubdomain } from '@/lib/tenants';
import { notFound } from 'next/navigation';
import { TenantProvider } from '@/components/providers/tenant-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { tenant: string } }): Promise<Metadata> {
  const tenant = getTenantBySubdomain(params.tenant);
  return {
    title: tenant ? `${tenant.name} | RFP CoPilot` : 'RFP CoPilot',
  };
}

export default function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  const tenant = getTenantBySubdomain(params.tenant);

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
