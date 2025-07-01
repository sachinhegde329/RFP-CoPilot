
import { getRfpsAction } from "@/app/actions";
import { HomepageClient } from "@/components/dashboard/dashboard-client";
import { HomepageHeader } from "@/components/dashboard/dashboard-header";
import { SidebarInset } from "@/components/ui/sidebar";
import type { RFP } from "@/lib/rfp.service";

export default async function Homepage({ params, searchParams }: { params: { tenant: string }, searchParams: { [key: string]: string | string[] | undefined }}) {
    const rfpsResult = await getRfpsAction(params.tenant);
    const rfps: RFP[] = rfpsResult.rfps || [];
    
    const rfpId = typeof searchParams.rfpId === 'string' ? searchParams.rfpId : rfps[0]?.id;
    const selectedRfp = rfps.find(r => r.id === rfpId) || rfps[0];

    const sanitizedRfps = JSON.parse(JSON.stringify(rfps));
    const sanitizedSelectedRfp = selectedRfp ? JSON.parse(JSON.stringify(selectedRfp)) : undefined;

    return (
        <SidebarInset className="flex-1">
          <HomepageHeader rfpName={sanitizedSelectedRfp?.name} />
          <main className="p-4 sm:p-6 lg:p-8">
            <HomepageClient 
              rfps={sanitizedRfps}
              selectedRfp={sanitizedSelectedRfp}
            />
          </main>
        </SidebarInset>
    )
}
