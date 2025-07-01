
import { getRfpsAction } from "@/app/actions";
import { HomepageClient } from "@/components/dashboard/dashboard-client";
import { HomepageHeader } from "@/components/dashboard/dashboard-header";
import { SidebarInset } from "@/components/ui/sidebar";
import type { RFP } from "@/lib/rfp.service";

export default async function Homepage({ params, searchParams }: { params: { tenant: string }, searchParams: { [key: string]: string | string[] | undefined }}) {
    const rfpsResult = await getRfpsAction(params.tenant);
    // Sanitize data at the boundary between server and client to prevent serialization errors.
    const rfps: RFP[] = JSON.parse(JSON.stringify(rfpsResult.rfps || []));
    
    const rfpId = typeof searchParams.rfpId === 'string' ? searchParams.rfpId : rfps[0]?.id;
    const selectedRfp = rfps.find(r => r.id === rfpId) || rfps[0];

    return (
        <SidebarInset className="flex-1">
          <HomepageHeader rfpName={selectedRfp?.name} />
          <main className="p-4 sm:p-6 lg:p-8">
            <HomepageClient 
              rfps={rfps}
              selectedRfp={selectedRfp}
            />
          </main>
        </SidebarInset>
    )
}
