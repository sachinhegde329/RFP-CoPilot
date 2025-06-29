'use client'

import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Database } from "lucide-react"

export default function KnowledgeBasePage() {
  return (
    <SidebarInset className="flex-1">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base</CardTitle>
            <CardDescription>
              Your central repository of approved answers and company information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg">
              <Database className="size-12 text-muted-foreground" />
              <h3 className="font-semibold">Knowledge Base is Empty</h3>
              <p className="text-sm text-muted-foreground">Add content to start building your answer library.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  )
}
