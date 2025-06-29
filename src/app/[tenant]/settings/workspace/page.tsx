import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function WorkspaceSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>
          Manage your workspace name, branding, and other settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg">
          <Settings className="size-12 text-muted-foreground" />
          <h3 className="font-semibold">Workspace Settings Coming Soon</h3>
          <p className="text-sm text-muted-foreground">Your workspace settings will appear here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
