
"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, Download, ShieldAlert, AlertTriangle } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import Link from "next/link"
import { hasFeatureAccess } from "@/lib/access-control"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { TeamMember } from "@/lib/tenants"

type Question = {
  id: number
  question: string
  category: string
  compliance: "passed" | "failed" | "pending"
  assignee?: TeamMember | null
  status: 'Unassigned' | 'In Progress' | 'Completed'
}

type TemplateCardProps = {
  questions: Question[]
  isLocked: boolean
  onLockChange: (locked: boolean) => void
}

export function TemplateCard({ questions, isLocked, onLockChange }: TemplateCardProps) {
  const { tenant } = useTenant()
  const [exportVersion, setExportVersion] = useState("v1.0")

  const canAccess = hasFeatureAccess(tenant, 'customTemplates');
  const currentUser = tenant.members[0]; // For demo
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Owner';
  
  const allQuestionsCompleted = questions.every(q => q.status === 'Completed');

  const canLock = allQuestionsCompleted || isAdmin;
  const isExportDisabled = !isLocked || (!allQuestionsCompleted && !isAdmin);

  const lockTooltipContent = isLocked
    ? "RFP is locked for editing."
    : !canLock
    ? "All questions must be 'Completed' before locking."
    : "Lock to prevent further edits by Editors.";
  
  const exportButtonTooltipContent = !isLocked 
    ? "RFP must be locked before exporting."
    : isExportDisabled && !isAdmin
    ? "All questions must be 'Completed' before exporting."
    : "Ready to export.";

  if (!canAccess) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10" />
        <CardHeader>
          <CardTitle>Export Response</CardTitle>
          <CardDescription>
            Format and export your response using branded templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="blur-sm select-none">
           {/* Content hidden by paywall */}
        </CardContent>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background/20 p-4 text-center">
          <Lock className="size-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Unlock Custom Templates</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to a Growth plan to use custom branding and formats.
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
        <CardTitle>Export Response</CardTitle>
        <CardDescription>
          Lock the RFP to finalize answers, then export the document.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <Label htmlFor="lock-rfp" className="flex flex-col space-y-1">
                            <span>Lock RFP for Export</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Prevents editors from making further changes.
                            </span>
                        </Label>
                        <Switch
                            id="lock-rfp"
                            checked={isLocked}
                            onCheckedChange={onLockChange}
                            disabled={!canLock}
                            aria-readonly={!canLock}
                        />
                    </div>
                </TooltipTrigger>
                {!isLocked && <TooltipContent><p>{lockTooltipContent}</p></TooltipContent>}
            </Tooltip>
        </TooltipProvider>

        {isLocked && !allQuestionsCompleted && isAdmin && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4"/>
                <AlertDescription>
                   Admin Override: You are exporting with incomplete questions.
                </AlertDescription>
            </Alert>
        )}

        <div className="space-y-2">
            <Label htmlFor="export-version">Export Version Tag</Label>
            <Input 
                id="export-version" 
                value={exportVersion} 
                onChange={(e) => setExportVersion(e.target.value)}
                disabled={!isLocked}
            />
        </div>
      </CardContent>
      <CardFooter>
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {/* The div wrapper is necessary for the tooltip to work on a disabled button */}
                    <div className="w-full"> 
                        <Button className="w-full" disabled={isExportDisabled}>
                            <Download className="mr-2" />
                            Export as PDF
                        </Button>
                    </div>
                </TooltipTrigger>
                {isExportDisabled && <TooltipContent><p>{exportButtonTooltipContent}</p></TooltipContent>}
            </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  )
}
