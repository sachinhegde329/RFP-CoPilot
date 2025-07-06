
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Lock } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { hasFeatureAccess } from "@/lib/access-control"

const complianceChecks = [
  { name: "ISO 27001", status: "passed" },
  { name: "SOC 2 Type II", status: "passed" },
  { name: "HIPAA", status: "passed" },
  { name: "GDPR", status: "failed" },
]

export function ComplianceCard() {
  const { tenant } = useTenant()
  const canAccess = hasFeatureAccess(tenant, 'complianceValidation');

  if (!canAccess) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10" />
        <CardHeader>
          <CardTitle>Compliance Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 blur-sm select-none">
            Auto-checking answers against compliance standards.
          </p>
          <div className="space-y-3 blur-sm select-none">
            {complianceChecks.map((check) => (
              <div key={check.name} className="flex items-center justify-between rounded-md border p-3">
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
              </div>
            ))}
          </div>
        </CardContent>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background/20 p-4 text-center">
             <Lock className="size-8 text-primary mb-2" />
             <h3 className="font-semibold mb-1">Upgrade to unlock</h3>
             <p className="text-sm text-muted-foreground mb-4">
               Compliance Validation is an Enterprise feature.
             </p>
             <Button asChild>
                <Link href={`/pricing?tenant=${tenant.subdomain}`}>View Plans</Link>
             </Button>
          </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Validation</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Auto-checking answers against compliance standards.
        </p>
        <div className="space-y-3">
          {complianceChecks.map((check) => (
            <div key={check.name} className="flex items-center justify-between rounded-md border p-3">
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
