
import { Suspense } from 'react';
import { HomepageClient } from "@/components/dashboard/dashboard-client";
import { SidebarInset } from "@/components/ui/sidebar";
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { HomepageHeader } from '@/components/dashboard/dashboard-header';
import { getRfpsAction } from '@/app/actions';
import { getTenantBySubdomain } from '@/lib/tenants';
import { notFound } from 'next/navigation';
import type { RFP } from '@/lib/rfp-types';

export default async function Homepage({ params }: { params: { tenant: string }}) {
    const tenant = await getTenantBySubdomain(params.tenant);
    if (!tenant) {
        notFound();
    }
    
    // Fetch data on the server
    const rfpResult = await getRfpsAction(tenant.id);
    const initialRfps: RFP[] = rfpResult.rfps || [];

    return (
        <SidebarInset className="flex-1 flex flex-col h-screen">
          <HomepageHeader />
          <Suspense fallback={<DashboardSkeleton />}>
            <HomepageClient initialRfps={initialRfps} />
          </Suspense>
        </SidebarInset>
    )
}
