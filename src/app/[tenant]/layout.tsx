
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { type Tenant } from '@/lib/tenant-types';
import { getTenantBySubdomainAction } from '@/app/actions';
import { TenantProvider } from '@/components/providers/tenant-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { Skeleton } from '@/components/ui/skeleton';

// A simple skeleton loader for the layout
function TenantLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex flex-col w-64 border-r p-4 gap-4 bg-muted/40">
        <Skeleton className="h-8 w-32 mx-auto" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <main className="flex-1 flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b px-6">
            <div className="flex-1"><Skeleton className="h-6 w-1/4" /></div>
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
        </header>
        <div className="p-6">
          <Skeleton className="h-[500px] w-full" />
        </div>
      </main>
    </div>
  );
}


export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tenantId = params.tenant as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchTenant = async () => {
      setIsLoading(true);
      const result = await getTenantBySubdomainAction(tenantId);
      if (result.error || !result.tenant) {
        console.error("Failed to load tenant:", result.error);
        setTenant(null); // This will trigger notFound()
      } else {
        setTenant(result.tenant);
      }
      setIsLoading(false);
    };

    fetchTenant();
  }, [tenantId]);
  
  if (isLoading) {
    return <TenantLayoutSkeleton />;
  }
  
  if (!tenant) {
    notFound();
  }

  // Dynamic metadata is lost, but we fix the crash.
  // We can update the document title on the client as a workaround.
  if (typeof window !== 'undefined') {
    document.title = `${tenant.name} | RFP CoPilot`;
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
