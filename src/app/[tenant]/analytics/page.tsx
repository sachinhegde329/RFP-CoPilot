'use client'

import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChartHorizontalBig } from "lucide-react"

export default function AnalyticsPage() {
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
