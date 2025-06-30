
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
import { Download, ShieldAlert, AlertTriangle, Loader2, UserCheck } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { TeamMember } from "@/lib/tenants"
import { exportRfpAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Separator } from "../ui/separator"

type Question = {
  id: number
  question: string
  category: string
  answer: string
  compliance: "passed" | "failed" | "pending"
  assignee?: TeamMember | null
  status: 'Unassigned' | 'In Progress' | 'Completed'
}

type TemplateCardProps = {
  questions: Question[]
  isLocked: boolean
  onLockChange: (locked: boolean) => void
  members: TeamMember[]
}

type Acknowledgments = Record<number, { acknowledged: boolean; comment: string }>;

export function TemplateCard({ questions, isLocked, onLockChange, members }: TemplateCardProps) {
  const { tenant } = useTenant()
  const { toast } = useToast()
  const [exportVersion, setExportVersion] = useState("v1.0")
  const [isExporting, setIsExporting] = useState(false)
  const [checklist, setChecklist] = useState({
      answersReviewed: false,
      complianceVerified: false,
  });
  const [acknowledgments, setAcknowledgments] = useState<Acknowledgments>({});

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

  const handleChecklistChange = (key: 'answersReviewed' | 'complianceVerified') => {
      setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAcknowledgeChange = (memberId: number, checked: boolean | 'indeterminate') => {
      if (typeof checked !== 'boolean') return;
      setAcknowledgments(prev => ({
          ...prev,
          [memberId]: { ...(prev[memberId] || { comment: '' }), acknowledged: checked }
      }));
  };

  const handleCommentChange = (memberId: number, comment: string) => {
      setAcknowledgments(prev => ({
          ...prev,
          [memberId]: { ...(prev[memberId] || { acknowledged: false }), comment: comment }
      }));
  };
    
  const handleExport = async (format: 'pdf' | 'docx') => {
    setIsExporting(true);
    
    const acknowledgmentsData = members
        .filter(member => acknowledgments[member.id]?.acknowledged)
        .map(member => ({
            name: member.name,
            role: member.role,
            comment: acknowledgments[member.id]?.comment || "Reviewed and approved."
        }));

    const result = await exportRfpAction({
        questions,
        isLocked,
        currentUserRole: currentUser.role,
        exportVersion,
        format,
        acknowledgments: acknowledgmentsData,
    });

    if (result.error || !result.fileData || !result.fileName || !result.mimeType) {
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: result.error || "Could not generate file for download.",
        });
    } else {
        toast({
            title: "Export Successful",
            description: `Started download for ${result.fileName}.`,
        });
        const link = document.createElement('a');
        link.href = `data:${result.mimeType};base64,${result.fileData}`;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    setIsExporting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finalize & Export</CardTitle>
        <CardDescription>
          Lock the RFP, complete the final review, and export the document.
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

        <div className="space-y-2">
            <Label>Pre-Export Checklist</Label>
            <div className="flex items-center space-x-2 pl-1">
                <Checkbox id="answersReviewed" checked={checklist.answersReviewed} onCheckedChange={() => handleChecklistChange('answersReviewed')} disabled={!isLocked} />
                <Label htmlFor="answersReviewed" className="font-normal text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70">All answers reviewed and approved</Label>
            </div>
            <div className="flex items-center space-x-2 pl-1">
                <Checkbox id="complianceVerified" checked={checklist.complianceVerified} onCheckedChange={() => handleChecklistChange('complianceVerified')} disabled={!isLocked} />
                <Label htmlFor="complianceVerified" className="font-normal text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Compliance checks passed</Label>
            </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="flex items-center gap-2"><UserCheck /> Team Acknowledgments</Label>
          <div className="space-y-3 pt-2">
            {members.map((member) => (
              <div key={member.id} className="space-y-2">
                <div className="flex items-center gap-3">
                    <Checkbox id={`ack-${member.id}`} disabled={!isLocked} checked={acknowledgments[member.id]?.acknowledged || false} onCheckedChange={(c) => handleAcknowledgeChange(member.id, c)} />
                    <Avatar className="h-6 w-6">
                        {member.avatar && <AvatarImage src={member.avatar} />}
                        <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Label htmlFor={`ack-${member.id}`} className="font-normal text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{member.name}</Label>
                </div>
                 {acknowledgments[member.id]?.acknowledged && (
                    <Input 
                        placeholder="Optional comment (e.g., 'Section 5 reviewed and approved.')" 
                        className="h-8 ml-9 text-xs"
                        value={acknowledgments[member.id]?.comment || ''}
                        onChange={(e) => handleCommentChange(member.id, e.target.value)}
                        disabled={!isLocked}
                    />
                 )}
              </div>
            ))}
          </div>
        </div>
        
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

        {isExportDisabled && (
          <Alert variant="secondary">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                  {exportButtonTooltipContent}
              </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {/* The div wrapper is necessary for the tooltip to work on a disabled button */}
                    <div className="w-full">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button className="w-full" disabled={isExportDisabled || isExporting}>
                              {isExporting ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                              {isExporting ? 'Exporting...' : 'Export Response'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
                          <DropdownMenuItem onSelect={() => handleExport('pdf')}>
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleExport('docx')}>
                            Export as Word (.docx)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                </TooltipTrigger>
                {isExportDisabled && <TooltipContent><p>{exportButtonTooltipContent}</p></TooltipContent>}
            </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  )
}
