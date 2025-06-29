'use client'

import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Blocks } from "lucide-react"

export default function TemplatesPage() {
  return (
    <SidebarInset className="flex-1">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              Manage your export templates for consistent, branded responses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg">
              <Blocks className="size-12 text-muted-foreground" />
              <h3 className="font-semibold">No Templates Created</h3>
              <p className="text-sm text-muted-foreground">Create templates to streamline your export process.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  )
}
