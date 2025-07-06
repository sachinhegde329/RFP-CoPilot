
import { Suspense } from 'react';
import { HomepageClient } from "@/components/dashboard/dashboard-client";
import { SidebarInset } from "@/components/ui/sidebar";
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { HomepageHeader } from '@/components/dashboard/dashboard-header';

export default async function Homepage({ params }: { params: { tenant: string }}) {
    return (
        <div className="flex-1 flex flex-col h-screen">
          <HomepageHeader />
          <Suspense fallback={<DashboardSkeleton />}>
            <HomepageClient />
          </Suspense>
        </div>
    )
}
