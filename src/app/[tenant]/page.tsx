
'use client';
import { useSearchParams } from "next/navigation"
import { rfpService, type RFP } from "@/lib/rfp.service"

import { SidebarInset } from "@/components/ui/sidebar"
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { HomepageClient } from "@/components/dashboard/dashboard-client"
import { useTenant } from "@/components/providers/tenant-provider"

export default function Homepage() {
  const { tenant } = useTenant();
  const searchParams = useSearchParams();
  
  // In a real app with a DB, this would be a single async call.
  // For our service, we get all RFPs then find the selected one.
  const rfps = rfpService.getRfps(tenant.id);
  const selectedRfpId = searchParams.get('rfpId') || rfps[0]?.id;
  const selectedRfp = rfpService.getRfp(tenant.id, selectedRfpId as string) || rfps[0];

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
