
import { SidebarInset } from "@/components/ui/sidebar"
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { ExportHistoryClient } from "@/components/history/export-history-client"
import { getExportHistoryAction, getRfpsAction } from "@/app/actions"
import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"
import type { RFP } from "@/lib/rfp-types"

export default async function RfpsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await both params and searchParams
  const [resolvedParams] = await Promise.all([
    params,
    searchParams || Promise.resolve({}),
  ]);
  const { tenant: tenantSubdomain } = resolvedParams;
  const tenant = await getTenantBySubdomain(tenantSubdomain);
  if (!tenant) {
      notFound();
  }

  // Fetch data for the history table for the entire tenant
  const [historyResult, rfpsResult] = await Promise.all([
    getExportHistoryAction(tenant.id),
    getRfpsAction(tenant.id)
  ]);
  
  const initialHistory = historyResult.history || [];
  const initialRfps: RFP[] = rfpsResult.rfps || [];
  
  return (
    <SidebarInset className="flex-1 flex flex-col">
      <HomepageHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
        <ExportHistoryClient initialHistory={initialHistory} initialRfps={initialRfps} />
      </main>
    </SidebarInset>
  )
}
