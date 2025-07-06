'use client'

import { useState, useMemo, useEffect } from "react"
import { QuestionTableRow } from "./question-table-row"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { TeamMember } from "@/lib/tenant-types"
import { useTenant } from "@/components/providers/tenant-provider"
import { PlusCircle, ChevronDown, Loader2, Download, AlertTriangle, UserCheck, ShieldAlert, Sparkles, CheckCheck } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Question } from "@/lib/rfp-types"
import type { Template } from "@/lib/template.service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { exportRfpAction, getTemplatesAction, generateAnswerAction, updateQuestionAction } from "@/app/actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { canPerformAction } from "@/lib/access-control"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"


type Acknowledgments = Record<string, { acknowledged: boolean; comment: string }>;

function ExportDialog({ rfpId, questions, members }: { rfpId: string, questions: Question[], members: TeamMember[] }) {
    const { tenant } = useTenant()
    const { toast } = useToast()
    const [exportVersion, setExportVersion] = useState("v1.0")
    const [isExporting, setIsExporting] = useState(false)
    const [checklist, setChecklist] = useState({
        answersReviewed: false,
        complianceVerified: false,
    });
    const [acknowledgments, setAcknowledgments] = useState<Acknowledgments>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('system-default-categorized');
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);


    const currentUser = tenant.members[0]; // For demo
    const canFinalize = canPerformAction(currentUser.role, 'finalizeExport');
    const isAdminOrOwner = currentUser.role === 'Admin' || currentUser.role === 'Owner';
    const allQuestionsCompleted = questions.every(q => q.status === 'Completed');
    
    const canExport = canFinalize && (allQuestionsCompleted || isAdminOrOwner);
    
    const exportButtonTooltipContent = !canFinalize 
        ? "You do not have permission to export."
        : !allQuestionsCompleted && !isAdminOrOwner
        ? "All questions must be 'Completed' before a non-admin can export."
        : "Ready to export.";
    
    useEffect(() => {
        if (isDialogOpen) {
            const fetchTemplates = async () => {
                setIsLoadingTemplates(true);
                const result = await getTemplatesAction(tenant.id, currentUser);
                if (result.templates) {
                    setTemplates(result.templates);
                    if (result.templates.length > 0 && !result.templates.find(t => t.id === selectedTemplate)) {
                        setSelectedTemplate(result.templates[0].id);
                    }
                } else {
                    toast({ variant: 'destructive', title: "Could not load templates" });
                }
                setIsLoadingTemplates(false);
            };
            fetchTemplates();
        }
    }, [isDialogOpen, tenant.id, currentUser, toast, selectedTemplate]);


    const handleChecklistChange = (key: 'answersReviewed' | 'complianceVerified') => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAcknowledgeChange = (memberId: string, checked: boolean | 'indeterminate') => {
        if (typeof checked !== 'boolean') return;
        setAcknowledgments(prev => ({
            ...prev,
            [memberId]: { ...(prev[memberId] || { comment: '' }), acknowledged: checked }
        }));
    };

    const handleCommentChange = (memberId: string, comment: string) => {
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
            tenantId: tenant.id,
            rfpId,
            templateId: selectedTemplate,
            currentUser: { name: currentUser.name, role: currentUser.role, id: currentUser.id },
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
        setIsDialogOpen(false);
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="default" disabled={questions.length === 0}><Download className="mr-2" />Export RFP</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Finalize &amp; Export</DialogTitle>
                    <DialogDescription>
                    Complete the final review checklist and export the RFP response.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="space-y-4">
                        <Label>Pre-Export Checklist</Label>
                        <div className="flex items-center space-x-2 pl-1">
                            <Checkbox id="answersReviewed" checked={checklist.answersReviewed} onCheckedChange={() => handleChecklistChange('answersReviewed')} />
                            <Label htmlFor="answersReviewed" className="font-normal text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70">All answers reviewed and approved</Label>
                        </div>
                        <div className="flex items-center space-x-2 pl-1">
                            <Checkbox id="complianceVerified" checked={checklist.complianceVerified} onCheckedChange={() => handleChecklistChange('complianceVerified')} />
                            <Label htmlFor="complianceVerified" className="font-normal text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Compliance checks passed</Label>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><UserCheck /> Team Acknowledgments</Label>
                            <div className="space-y-3 pt-2">
                                {members.map((member) => (
                                <div key={member.id} className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Checkbox id={`ack-${member.id}`} checked={acknowledgments[member.id]?.acknowledged || false} onCheckedChange={(c) => handleAcknowledgeChange(member.id, c)} />
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
                                        />
                                    )}
                                </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {!canExport && (
                          <Alert variant="destructive">
                              <ShieldAlert className="h-4 w-4" />
                              <AlertDescription>
                                  {exportButtonTooltipContent}
                              </AlertDescription>
                          </Alert>
                        )}
                        {!allQuestionsCompleted && isAdminOrOwner && (
                            <Alert variant="default">
                                <AlertTriangle className="h-4 w-4"/>
                                <AlertDescription>
                                Admin Override: You can export with incomplete questions.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="export-template">Export Template</Label>
                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate} disabled={isLoadingTemplates}>
                                <SelectTrigger id="export-template">
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                     {isLoadingTemplates ? (
                                        <SelectItem value="loading" disabled>Loading templates...</SelectItem>
                                    ) : (
                                        templates.map(template => (
                                            <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="export-version">Export Version Tag</Label>
                            <Input 
                                id="export-version" 
                                value={exportVersion} 
                                onChange={(e) => setExportVersion(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                     <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                {/* The div wrapper is necessary for the tooltip to work on a disabled button */}
                                <div className="w-full sm:w-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button className="w-full" disabled={!canExport || isExporting}>
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
                            {!canExport && <TooltipContent><p>{exportButtonTooltipContent}</p></TooltipContent>}
                        </Tooltip>
                    </TooltipProvider>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

type QAndAListProps = {
  questions: Question[]
  tenantId: string
  rfpId: string
  members: TeamMember[]
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => void;
  onAddQuestion: (questionData: Omit<Question, 'id'>) => Promise<boolean>;
}

type FilterType = "all" | "assignedToMe" | "unassigned" | "inProgress" | "completed"

export function QAndAList({ questions, tenantId, rfpId, members, onUpdateQuestion, onAddQuestion }: QAndAListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const { tenant } = useTenant(); 
  const { toast } = useToast();
  const currentUser = tenant.members[0]; // For demo, assume current user is the first member

  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('Product');
  
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const canEditContent = canPerformAction(currentUser.role, 'editContent');

  // Reset selection when filter or questions change
  useEffect(() => {
    setSelectedRowIds([]);
  }, [activeFilter, questions]);

  const filteredQuestions = useMemo(() => {
    switch (activeFilter) {
      case "assignedToMe":
        return questions.filter(q => q.assignee?.id === currentUser.id)
      case "unassigned":
        return questions.filter(q => !q.assignee)
      case "inProgress":
        return questions.filter(q => q.status === 'In Progress')
      case "completed":
        return questions.filter(q => q.status === 'Completed')
      case "all":
      default:
        return questions
    }
  }, [questions, activeFilter, currentUser.id])
  
  // Progress calculation
  const completedCount = useMemo(() => questions.filter(q => q.status === 'Completed').length, [questions]);
  const totalCount = questions.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const numSelected = selectedRowIds.length;
  const numDisplayed = filteredQuestions.length;
  const areAllSelected = numDisplayed > 0 && numSelected === numDisplayed;
  const areSomeSelected = numSelected > 0 && numSelected < numDisplayed;

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
      if (checked === true) {
          setSelectedRowIds(filteredQuestions.map(q => q.id));
      } else {
          setSelectedRowIds([]);
      }
  };
  
  const handleRowSelect = (questionId: number, isSelected: boolean) => {
      if (isSelected) {
          setSelectedRowIds(prev => [...prev, questionId]);
      } else {
          setSelectedRowIds(prev => prev.filter(id => id !== questionId));
      }
  };

  const handleBulkGenerate = async () => {
    setIsBulkProcessing(true);
    const questionsToGenerate = questions.filter(q => selectedRowIds.includes(q.id));
    let successCount = 0;
    
    toast({ title: "Bulk Generation Started", description: `Generating answers for ${questionsToGenerate.length} questions.` });
    
    const promises = questionsToGenerate.map(async (q) => {
        const result = await generateAnswerAction(q.question, rfpId, tenantId, currentUser);
        if (!result.error && result.answer) {
            await onUpdateQuestion(q.id, { answer: result.answer });
            successCount++;
        }
    });
    
    await Promise.all(promises);
    
    toast({ title: "Bulk Generation Complete", description: `Successfully generated ${successCount} of ${questionsToGenerate.length} answers.` });
    
    setIsBulkProcessing(false);
    setSelectedRowIds([]);
  };

  const handleBulkMarkComplete = async () => {
      setIsBulkProcessing(true);
      toast({ title: "Bulk Update Started", description: `Marking ${numSelected} questions as complete.` });
      
      const promises = selectedRowIds.map(id => updateQuestionAction(tenantId, rfpId, id, { status: 'Completed' }, currentUser));
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => !r.error).length;
      
      // Manually trigger a state update for all completed questions
      selectedRowIds.forEach(id => onUpdateQuestion(id, { status: 'Completed' }));

      toast({ title: "Bulk Update Complete", description: `Successfully marked ${successCount} of ${numSelected} questions as complete.` });
      
      setIsBulkProcessing(false);
      setSelectedRowIds([]);
  };

  const isAssignmentFilterActive = activeFilter === 'assignedToMe' || activeFilter === 'unassigned';
  const assignmentFilterLabel = useMemo(() => {
    if (activeFilter === 'assignedToMe') return 'Assigned to Me';
    if (activeFilter === 'unassigned') return 'Unassigned';
    return 'Filter by Assignee';
  }, [activeFilter]);

  const isStatusFilterActive = activeFilter === 'inProgress' || activeFilter === 'completed';
  const statusFilterLabel = useMemo(() => {
    if (activeFilter === 'inProgress') return 'In Progress';
    if (activeFilter === 'completed') return 'Completed';
    return 'Filter by Status';
  }, [activeFilter]);

  const handleAddQuestion = async () => {
    if (!newQuestionText.trim()) {
        toast({ variant: 'destructive', title: 'Question text is required' });
        return;
    }
    setIsAddingQuestion(true);
    const questionData: Omit<Question, 'id'> = {
        question: newQuestionText,
        category: newQuestionCategory,
        answer: '',
        compliance: 'pending',
        assignee: null,
        status: 'Unassigned',
    };
    const success = await onAddQuestion(questionData);
    if (success) {
        setIsAddQuestionDialogOpen(false);
        setNewQuestionText('');
        setNewQuestionCategory('Product');
    }
    setIsAddingQuestion(false);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Extracted Questions</CardTitle>
            <CardDescription>
              Filter, assign, and answer the questions for this RFP.
            </CardDescription>
          </div>
          <ExportDialog rfpId={rfpId} questions={questions} members={members} />
        </div>

        {totalCount > 0 && (
          <div className="pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Overall Progress</span>
                  <span>{completedCount} of {totalCount} Completed</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-4">
            <div className="flex gap-2 flex-wrap">
                <Button variant={activeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('all')}>All ({questions.length})</Button>
                
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={isAssignmentFilterActive ? 'default' : 'outline'} size="sm" className="flex items-center">
                    {assignmentFilterLabel}
                    <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)}>
                        <DropdownMenuRadioItem value="assignedToMe">Assigned to Me ({questions.filter(q => q.assignee?.id === currentUser.id).length})</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="unassigned">Unassigned ({questions.filter(q => !q.assignee).length})</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={isStatusFilterActive ? 'default' : 'outline'} size="sm" className="flex items-center">
                    {statusFilterLabel}
                    <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)}>
                        <DropdownMenuRadioItem value="inProgress">In Progress ({questions.filter(q => q.status === 'In Progress').length})</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="completed">Completed ({questions.filter(q => q.status === 'Completed').length})</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="ml-auto flex gap-2">
                <Dialog open={isAddQuestionDialogOpen} onOpenChange={setIsAddQuestionDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!canEditContent}>
                            <PlusCircle className="mr-2" />
                            Add Question
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add a New Question</DialogTitle>
                            <DialogDescription>
                                Manually add a question that was missed during extraction.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="question-text">Question</Label>
                                <Textarea 
                                    id="question-text" 
                                    placeholder="Enter the question text..." 
                                    value={newQuestionText}
                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                    disabled={isAddingQuestion} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="question-category">Category</Label>
                                <Select 
                                    value={newQuestionCategory}
                                    onValueChange={setNewQuestionCategory}
                                    disabled={isAddingQuestion}
                                >
                                    <SelectTrigger id="question-category">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Product">Product</SelectItem>
                                        <SelectItem value="Legal">Legal</SelectItem>
                                        <SelectItem value="Security">Security</SelectItem>
                                        <SelectItem value="Pricing">Pricing</SelectItem>
                                        <SelectItem value="Company">Company</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleAddQuestion} disabled={isAddingQuestion}>
                                {isAddingQuestion && <Loader2 className="mr-2 animate-spin" />}
                                Add Question
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-4">
                  <Checkbox
                    checked={areAllSelected ? true : areSomeSelected ? 'indeterminate' : false}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    disabled={!canEditContent || numDisplayed === 0}
                  />
                </TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 text-right"><span className="sr-only">Expand</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map(q => (
                  <QuestionTableRow
                    key={q.id}
                    questionData={q}
                    tenantId={tenantId}
                    rfpId={rfpId}
                    members={members}
                    onUpdateQuestion={onUpdateQuestion}
                    isSelected={selectedRowIds.includes(q.id)}
                    onSelectChange={handleRowSelect}
                    canEdit={canEditContent}
                  />
                ))
              ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No questions match the current filter.
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
      </CardContent>
      {numSelected > 0 && (
          <CardFooter className="p-3 border-t bg-muted/50 justify-between items-center sticky bottom-0">
              <span className="text-sm text-muted-foreground">{numSelected} selected</span>
              <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkGenerate} disabled={isBulkProcessing || !canEditContent}>
                      {isBulkProcessing ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                      Generate Answers
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkMarkComplete} disabled={isBulkProcessing || !canEditContent}>
                      {isBulkProcessing ? <Loader2 className="mr-2 animate-spin" /> : <CheckCheck className="mr-2" />}
                      Mark as Complete
                  </Button>
              </div>
          </CardFooter>
      )}
    </Card>
  )
}
