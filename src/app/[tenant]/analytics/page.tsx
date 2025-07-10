import { SidebarInset } from "@/components/ui/sidebar"
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { getRfpInsightsAction } from "@/app/actions"
import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"
import { RfpInsightsDashboard } from "@/components/analytics/rfp-insights-dashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChartHorizontalBig } from "lucide-react"

type AnalyticsPageProps = {
  params: { tenant: string };
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
      notFound();
  }

  const currentUser = tenant.members[0];
  const result = await getRfpInsightsAction(tenant.id);

  return (
    <SidebarInset className="flex-1 flex flex-col">
      <HomepageHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        {result.error ? (
          <Alert variant="secondary">
            <BarChartHorizontalBig className="h-4 w-4" />
            <AlertTitle>Not Enough Data</AlertTitle>
            <AlertDescription>
              {result.error} Analytics will appear here once you have sufficient data.
            </AlertDescription>
          </Alert>
        ) : (
          <RfpInsightsDashboard initialInsights={result.insights!} />
        )}
      </main>
    </SidebarInset>
  )
}
