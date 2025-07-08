import { SidebarInset } from "@/components/ui/sidebar"
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { getRfpInsightsAction } from "@/app/actions"
import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"
import { RfpInsightsDashboard } from "@/components/analytics/rfp-insights-dashboard"
import { hasFeatureAccess } from "@/lib/access-control"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lock, BarChartHorizontalBig } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const UpgradeCard = ({ tenantSubdomain }: { tenantSubdomain: string }) => (
    <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10" />
        <CardHeader>
            <CardTitle>RFP Insights Dashboard</CardTitle>
            <CardDescription>
                Uncover themes, feature gaps, and competitive intelligence from your RFPs.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg blur-sm select-none">
            <BarChartHorizontalBig className="size-12 text-muted-foreground" />
            <h3 className="font-semibold">Gain a Competitive Edge</h3>
            <p className="text-sm text-muted-foreground">Unlock powerful insights from your RFP data.</p>
            </div>
        </CardContent>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background/20 p-4 text-center">
            <Lock className="size-8 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Upgrade to Unlock Insights</h3>
            <p className="text-sm text-muted-foreground mb-4">
            This feature is available on our Business and Enterprise plans.
            </p>
            <Button asChild>
            <Link href={`/pricing?tenant=${tenantSubdomain}`}>View Plans</Link>
            </Button>
        </div>
    </Card>
);

export default async function AnalyticsPage({ params }: { params: { tenant: string } }) {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
      notFound();
  }

  const canAccess = hasFeatureAccess(tenant, 'analytics');
  
  if (!canAccess) {
      return (
         <SidebarInset className="flex-1 flex flex-col">
            <HomepageHeader />
            <main className="p-4 sm:p-6 lg:p-8">
                <UpgradeCard tenantSubdomain={tenant.subdomain} />
            </main>
        </SidebarInset>
      )
  }

  const currentUser = tenant.members[0];
  const result = await getRfpInsightsAction(tenant.id, currentUser);

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
