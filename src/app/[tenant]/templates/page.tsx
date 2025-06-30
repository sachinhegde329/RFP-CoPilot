
import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Blocks, PlusCircle, FileText, FileJson, Copy, MoreHorizontal, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const templates = [
  {
    name: "Default Categorized",
    description: "A standard template that groups questions by their assigned category (e.g., Security, Legal).",
    type: "System",
    icon: FileText,
  },
  {
    name: "Formal Proposal",
    description: "A professional template suitable for formal submissions, including a cover page and table of contents.",
    type: "System",
    icon: FileJson,
  }
]

export default function TemplatesPage() {
  return (
    <SidebarInset className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Export Templates</h1>
                <p className="text-muted-foreground">Manage your export templates for consistent, branded responses.</p>
            </div>
            <Button>
                <PlusCircle className="mr-2" />
                Create New Template
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.name}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <template.icon className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                  </div>
                   <Button variant="ghost" size="icon">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{template.description}</CardDescription>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" className="w-full">
                  <Copy className="mr-2" />
                  Duplicate
                </Button>
                <Button variant="secondary" className="w-full">
                  <Settings className="mr-2" />
                  Configure
                </Button>
              </CardFooter>
            </Card>
          ))}
            <Card className="border-dashed flex items-center justify-center">
              <Button variant="ghost" className="flex-col h-auto gap-2">
                <PlusCircle className="size-8 text-muted-foreground" />
                <span className="text-sm font-semibold">Create from scratch</span>
              </Button>
            </Card>
        </div>
      </main>
    </SidebarInset>
  )
}
