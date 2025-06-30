import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"
import { rfpService } from "@/lib/rfp.service"

import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default function DashboardPage({ params }: { params: { tenant: string }}) {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
      notFound();
  }
  
  // Get questions from the new persistence service
  const initialQuestions = rfpService.getQuestions(tenant.id);

  return (
    <SidebarInset className="flex-1">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        <DashboardClient 
          initialQuestions={initialQuestions}
        />
      </main>
    </SidebarInset>
  )
}
