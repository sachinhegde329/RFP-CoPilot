
import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ExportHistoryClient } from "@/components/history/export-history-client"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { getExportHistoryAction } from "@/app/actions"
import { getTenantBySubdomain } from "@/lib/tenants"
import { rfpService } from "@/lib/rfp.service"
import { notFound } from "next/navigation"

export default async function RfpsPage({ params }: { params: { tenant: string }}) {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
      notFound();
  }

  // Fetch data for both the Q&A workspace and the history table
  const rfpId = 'main_rfp';
  const historyResult = await getExportHistoryAction(tenant.id, rfpId);
  const initialHistory = historyResult.history || [];
  
  const initialQuestions = rfpService.getQuestions(tenant.id);
  
  return (
    <SidebarInset className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto space-y-8">
        {/* Render the main Q&A workspace */}
        <DashboardClient initialQuestions={initialQuestions} />
        
        {/* Render the export history table below */}
        <ExportHistoryClient initialHistory={initialHistory} />
      </main>
    </SidebarInset>
  )
}
