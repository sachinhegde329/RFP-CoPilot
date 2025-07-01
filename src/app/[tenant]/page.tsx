'use client';
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react";
import type { RFP } from "@/lib/rfp.service"
import { getRfpsAction } from "@/app/actions";

import { SidebarInset } from "@/components/ui/sidebar"
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { HomepageClient } from "@/components/dashboard/dashboard-client"
import { useTenant } from "@/components/providers/tenant-provider"
import { Skeleton } from "@/components/ui/skeleton";

export default function Homepage() {
  const { tenant } = useTenant();
  const searchParams = useSearchParams();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // The searchParams object is reactive. This effect will re-run when the URL query changes.
  useEffect(() => {
    setIsLoading(true);
    getRfpsAction(tenant.id).then(result => {
      if (result.rfps) {
        setRfps(result.rfps);
      }
      setIsLoading(false);
    });
  }, [tenant.id, searchParams]); // Rerun when tenant changes or URL query params change

  const selectedRfpId = searchParams.get('rfpId') || rfps[0]?.id;
  const selectedRfp = rfps.find(r => r.id === selectedRfpId) || rfps[0];
  
  if (isLoading || !selectedRfp) {
    return (
        <SidebarInset className="flex-1">
          <HomepageHeader />
          <main className="p-4 sm:p-6 lg:p-8 space-y-6">
              <Skeleton className="h-12 w-full md:w-[320px]" />
              <Skeleton className="h-64 w-full" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2"><Skeleton className="h-96 w-full" /></div>
                  <div className="lg:col-span-1 space-y-6">
                      <Skeleton className="h-48 w-full" />
                      <Skeleton className="h-48 w-full" />
                  </div>
              </div>
          </main>
        </SidebarInset>
    )
  }

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
