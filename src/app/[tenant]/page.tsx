
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { HomepageClient } from "@/components/dashboard/dashboard-client";
import { SidebarInset } from "@/components/ui/sidebar";
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { HomepageHeader } from '@/components/dashboard/dashboard-header';
import { getRfpsAction, extractQuestionsAction } from '@/app/actions';
import { getTenantBySubdomain } from '@/lib/tenants';
import { notFound } from 'next/navigation';
import type { RFP } from '@/lib/rfp-types';
import { RfpSummaryCard } from '@/components/dashboard/rfp-summary-card';
import { AuthStatus } from '@/components/auth/auth-status';


/**
 * A server component that renders the view for a workspace with no active RFPs.
 * It contains the card for uploading or pasting a new RFP.
 */
function EmptyDashboard({ tenantId }: { tenantId: string }) {

    // This server action will be bound with the necessary arguments
    // and passed to the RfpSummaryCard client component.
    const processRfp = async (rfpText: string, file?: File) => {
        'use server'
        if (!rfpText) return { error: "RFP text cannot be empty." };

        const tenant = await getTenantBySubdomain(tenantId);
        if (!tenant) return { error: "Tenant not found." };
        
        const rfpName = file ? file.name.replace(/\.[^/.]+$/, "") : `Pasted RFP - ${new Date().toLocaleDateString()}`;

        const currentUser = tenant.members[0];

        const result = await extractQuestionsAction(rfpText, rfpName, tenant.id);
        
        if (result.error || !result.rfp) {
            // Return an error to be handled by the client component's form state.
            return { error: result.error || "An unknown error occurred while processing the RFP." };
        }
        
        // On success, redirect to the dashboard with the new RFP selected.
        redirect(`/${tenant.subdomain}?rfpId=${result.rfp.id}`);
    }

    return (
        <main className="p-4 sm:p-6 lg:p-8 flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl">
                <AuthStatus />
                <RfpSummaryCard onProcessRfp={processRfp} />
            </div>
        </main>
    );
}


export default async function Homepage({ params }: { params: Promise<{ tenant: string }>}) {
    const { tenant: tenantSubdomain } = await params;
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
        notFound();
    }
    
    // Fetch all RFPs on the server
    const rfpResult = await getRfpsAction(tenant.id);
    const allRfps: RFP[] = rfpResult.rfps || [];
    
    // Determine which view to render on the server
    const activeRfps = allRfps.filter(r => r.status !== 'Won' && r.status !== 'Lost');

    return (
        <SidebarInset className="flex-1 flex flex-col h-screen">
          <HomepageHeader />
          <Suspense fallback={<DashboardSkeleton />}>
            {activeRfps.length > 0 ? (
                // If there are active RFPs, render the full interactive client
                <HomepageClient initialRfps={allRfps} />
            ) : (
                // Otherwise, render the lightweight static empty state
                <EmptyDashboard tenantId={tenant.id} />
            )}
          </Suspense>
        </SidebarInset>
    )
}
