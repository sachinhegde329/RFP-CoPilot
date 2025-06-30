
import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function RfpsPage() {
  return (
    <SidebarInset className="flex-1">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>RFPs</CardTitle>
            <CardDescription>
              Manage all your Request for Proposals here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg">
              <FileText className="size-12 text-muted-foreground" />
              <h3 className="font-semibold">No RFPs Yet</h3>
              <p className="text-sm text-muted-foreground">Your uploaded RFPs will be listed here.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  )
}
