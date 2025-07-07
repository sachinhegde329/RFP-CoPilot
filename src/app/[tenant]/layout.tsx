
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { type Tenant } from '@/lib/tenant-types';
import { getTenantBySubdomain } from '@/lib/tenants';
import { TenantProvider } from '@/components/providers/tenant-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import AuthGuard from '@/components/auth/auth-guard';

export function generateMetadata({ params }: { params: { tenant: string } }): Metadata {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
    return {
      title: 'Not Found'
    };
  }
  return {
    title: `${tenant.name} | RFP CoPilot`,
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

  const TenantContent = (
    <TenantProvider tenant={tenant}>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen">
          <AppSidebar />
          {children}
        </div>
      </SidebarProvider>
    </TenantProvider>
  );

  // Allow public access to the 'megacorp' demo tenant
  if (params.tenant === 'megacorp') {
    return TenantContent;
  }

  // Wrap other tenants in the AuthGuard to enforce authentication
  return <AuthGuard>{TenantContent}</AuthGuard>;
}
