
import { SidebarInset } from "@/components/ui/sidebar"
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { ExportHistoryClient } from "@/components/history/export-history-client"
import { getExportHistoryAction } from "@/app/actions"
import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"

export default async function RfpsPage({ params }: { params: { tenant: string }}) {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
      notFound();
  }

  // Fetch data for the history table for the entire tenant
  const historyResult = await getExportHistoryAction(tenant.id);
  const initialHistory = historyResult.history || [];
  
  return (
    <SidebarInset className="flex-1 flex flex-col">
      <HomepageHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
        <ExportHistoryClient initialHistory={initialHistory} />
      </main>
    </SidebarInset>
  )
}
