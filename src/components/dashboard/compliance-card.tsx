import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"

const complianceChecks = [
  { name: "ISO 27001", status: "passed" },
  { name: "SOC 2 Type II", status: "passed" },
  { name: "HIPAA", status: "passed" },
  { name: "GDPR", status: "failed" },
]

export function ComplianceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Validation</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Auto-checking answers against compliance standards.
        </p>
        <ul className="space-y-3">
          {complianceChecks.map((check) => (
            <li key={check.name} className="flex items-center justify-between">
              <span className="font-medium text-sm">{check.name}</span>
              {check.status === "passed" ? (
                <Badge variant="secondary" className="text-green-600">
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Passed
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-1 h-4 w-4" /> Failed
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
