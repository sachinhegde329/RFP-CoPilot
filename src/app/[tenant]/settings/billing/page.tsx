import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

export default function BillingSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          Manage your subscription, payment methods, and view invoices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg">
          <CreditCard className="size-12 text-muted-foreground" />
          <h3 className="font-semibold">Billing Management Coming Soon</h3>
          <p className="text-sm text-muted-foreground">Your subscription details will appear here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
