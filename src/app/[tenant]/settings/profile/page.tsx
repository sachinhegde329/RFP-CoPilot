import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { User } from "lucide-react"

export default function ProfileSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>
          Update your personal information and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg">
          <User className="size-12 text-muted-foreground" />
          <h3 className="font-semibold">Profile Settings Coming Soon</h3>
          <p className="text-sm text-muted-foreground">Your profile information will appear here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
