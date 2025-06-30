
import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ExportHistoryClient } from "@/components/history/export-history-client"
import { getExportHistoryAction } from "@/app/actions"
import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"

export default async function HistoryPage({ params }: { params: { tenant: string }}) {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
      notFound();
  }

  // Assuming a single RFP for now
  const rfpId = 'main_rfp';
  const historyResult = await getExportHistoryAction(tenant.id, rfpId);
  
  const initialHistory = historyResult.history || [];
  
  return (
    <SidebarInset className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
        <ExportHistoryClient initialHistory={initialHistory} />
      </main>
    </SidebarInset>
  )
}
