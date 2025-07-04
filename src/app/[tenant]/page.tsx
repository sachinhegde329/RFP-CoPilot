
import { Suspense } from 'react';
import { HomepageClient } from "@/components/dashboard/dashboard-client";
import { SidebarInset } from "@/components/ui/sidebar";
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export default async function Homepage({ params }: { params: { tenant: string }}) {
    return (
        <SidebarInset className="flex-1 flex flex-col">
            <Suspense fallback={<DashboardSkeleton />}>
                <HomepageClient />
            </Suspense>
        </SidebarInset>
    )
}
