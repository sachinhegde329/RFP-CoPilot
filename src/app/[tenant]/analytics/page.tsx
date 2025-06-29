
'use client'

import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChartHorizontalBig, Lock } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { hasFeatureAccess } from "@/lib/access-control"

export default function AnalyticsPage() {
  const { tenant } = useTenant()
  const canAccess = hasFeatureAccess(tenant, 'analytics');

  if (!canAccess) {
    return (
      <SidebarInset className="flex-1">
        <DashboardHeader />
        <main className="p-4 sm:p-6 lg:p-8">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10" />
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Gain insights into your RFP process and win rates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg blur-sm select-none">
                <BarChartHorizontalBig className="size-12 text-muted-foreground" />
                <h3 className="font-semibold">Not Enough Data</h3>
                <p className="text-sm text-muted-foreground">Analytics will appear here once you process more RFPs.</p>
              </div>
            </CardContent>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background/20 p-4 text-center">
              <Lock className="size-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Upgrade to Unlock Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This feature is available on our Growth and Enterprise plans.
              </p>
              <Button asChild>
                <Link href={`/pricing?tenant=${tenant.subdomain}`}>View Plans</Link>
              </Button>
            </div>
          </Card>
        </main>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset className="flex-1">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              Gain insights into your RFP process and win rates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg">
              <BarChartHorizontalBig className="size-12 text-muted-foreground" />
              <h3 className="font-semibold">Not Enough Data</h3>
              <p className="text-sm text-muted-foreground">Analytics will appear here once you process more RFPs.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  )
}
