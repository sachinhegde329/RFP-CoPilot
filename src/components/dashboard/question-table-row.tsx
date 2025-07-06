
"use client"

import { useState, memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sparkles, CheckCircle2, AlertTriangle, History, Loader2, Bot, Clipboard, ClipboardCheck, BookOpenCheck, UserPlus, Circle, CheckCircle, CircleDotDashed, Bold, Italic, Underline, List, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAnswerAction, reviewAnswerAction } from "@/app/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTenant } from "@/components/providers/tenant-provider"
import { hasFeatureAccess, canPerformAction } from "@/lib/access-control"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { TeamMember } from "@/lib/tenant-types"
import { Input } from "../ui/input"
import { cn } from "@/lib/utils"
import type { Question } from "@/lib/rfp-types";
import { Card } from "@/components/ui/card"

type QAndAItemProps = {
  questionData: Question
  tenantId: string
  rfpId: string
  members: TeamMember[]
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => void
}

export const QAndAItem = memo(function QAndAItem({ questionData, tenantId, rfpId, members, onUpdateQuestion }: QAndAItemProps) {
  const { id, question, category, assignee, status, answer } = questionData;
  const { tenant } = useTenant();
  const { toast } = useToast();
  
  const [currentAnswer, setCurrentAnswer] = useState(answer);
  const [sources, setSources] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const currentUser = tenant.members[0];
  const canUseAiReview = hasFeatureAccess(tenant, 'aiExpertReview');
  const canEdit = canPerformAction(currentUser.role, 'editContent');
  const canAssign = canPerformAction(currentUser.role, 'assignQuestions');
  
  const [comment, setComment] = useState("");

  const handleGenerateAnswer = async () => {
    setIsGenerating(true);
    setReview("");
    setSources([]);
    setConfidence(null);
    
    const result = await generateAnswerAction(question, rfpId, tenantId, currentUser);
    if (result.error) {
        const isInfo = result.error.includes("knowledge base");
        toast({
            variant: isInfo ? "default" : "destructive",
            title: isInfo ? "Answer Not Found" : "Error",
            description: result.error,
        });
    } else {
      setCurrentAnswer(result.answer || "");
      setSources(result.sources || []);
      setConfidence(result.confidenceScore || null);
    }
    setIsGenerating(false);
  };
  
  const handleAcceptAnswer = () => {
      onUpdateQuestion(id, { answer: currentAnswer, status: 'Completed' });
      toast({
          title: "Answer Accepted",
          description: "The answer has been saved and marked as completed.",
      });
  }

  const handleReviewAnswer = async () => {
    if (!currentAnswer) {
      toast({
        variant: "destructive",
        title: "Cannot Review",
        description: "Please provide an answer before requesting a review.",
      });
      return;
    }
    setIsReviewing(true);
    const result = await reviewAnswerAction(question, currentAnswer, tenant.id, currentUser);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      setReview(result.review || "");
    }
    setIsReviewing(false);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(currentAnswer);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAssigneeChange = (memberId: string) => {
    const member = members.find(m => m.id.toString() === memberId) || null;
    onUpdateQuestion(id, { assignee: member });
  };

  const handleStatusChange = (newStatus: Question['status']) => {
    onUpdateQuestion(id, { status: newStatus });
  };

  const StatusIcon = ({ status, className }: { status: Question['status'], className?: string }) => {
    switch (status) {
      case 'Completed': return <CheckCircle className={cn("h-4 w-4 text-green-600", className)} />;
      case 'In Progress': return <CircleDotDashed className={cn("h-4 w-4 text-yellow-600", className)} />;
      case 'Unassigned':
      default: return <Circle className={cn("h-4 w-4 text-muted-foreground", className)} />;
    }
  };

  return (
    <AccordionItem value={`item-${id}`} className="border-b-0">
        <Card>
        <AccordionTrigger className="p-4 hover:no-underline [&[data-state=open]]:border-b">
            <div className="flex items-center gap-4 flex-1 text-left">
                <StatusIcon status={status} className="flex-shrink-0" />
                <span className="font-medium">Q{id}: {question}</span>
            </div>
            <div className="flex items-center gap-4 pl-4">
                 <Badge variant="outline" className="hidden sm:inline-flex">{category}</Badge>
                 <TooltipProvider delayDuration={100}>
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button disabled={!canAssign} className={cn("flex h-6 w-6 items-center justify-center rounded-full", canAssign ? "hover:bg-accent/50" : "cursor-not-allowed")}>
                            {assignee ? (
                                <Avatar className="h-full w-full">
                                {assignee.avatar && <AvatarImage src={assignee.avatar} alt={assignee.name} />}
                                <AvatarFallback className="text-xs">{assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed">
                                <UserPlus className="h-3 w-3 text-muted-foreground" />
                                </div>
                            )}
                            </button>
                        </DropdownMenuTrigger>
                        {canAssign && (
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleAssigneeChange('unassigned')}>
                                    <UserPlus className="mr-2 h-4 w-4"/>
                                    Unassigned
                                </DropdownMenuItem>
                                {members.map(member => (
                                    <DropdownMenuItem key={member.id} onSelect={() => handleAssigneeChange(member.id.toString())}>
                                    <Avatar className="h-5 w-5 mr-2">
                                        {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                                        <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {member.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        )}
                        </DropdownMenu>
                    </TooltipTrigger>
                    <TooltipContent><p>{assignee ? `Assigned to ${assignee.name}` : 'Unassigned'}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto p-1 font-normal capitalize flex items-center gap-1" disabled={!canEdit}>
                           <span className="hidden sm:inline-flex">{status}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleStatusChange('Unassigned')}>
                        <Circle className="mr-2 h-4 w-4 text-muted-foreground" /> Unassigned
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleStatusChange('In Progress')}>
                        <CircleDotDashed className="mr-2 h-4 w-4 text-yellow-600" /> In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleStatusChange('Completed')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Completed
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                    <div className="rounded-md border bg-background">
                        <div className="p-2 border-b flex items-center gap-1">
                            <Button variant="ghost" size="icon" disabled={!canEdit}><Bold /></Button>
                            <Button variant="ghost" size="icon" disabled={!canEdit}><Italic /></Button>
                            <Button variant="ghost" size="icon" disabled={!canEdit}><Underline /></Button>
                            <Button variant="ghost" size="icon" disabled={!canEdit}><List /></Button>
                        </div>
                        <div className="relative">
                            <Textarea
                            placeholder="Draft your answer here..."
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            className="min-h-[150px] w-full resize-y border-0 pr-10 focus-visible:ring-0"
                            disabled={!canEdit}
                            />
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
                                {isCopied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                                <span className="sr-only">Copy</span>
                            </Button>
                        </div>
                    </div>
                     <div className="flex flex-col-reverse sm:flex-row gap-2 justify-between items-center">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button onClick={handleGenerateAnswer} disabled={isGenerating || !canEdit} className="w-full sm:w-auto">
                                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                Generate
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleReviewAnswer}
                                disabled={isReviewing || !currentAnswer || !canUseAiReview || !canEdit}
                                className="w-full sm:w-auto"
                            >
                                {isReviewing ? <Loader2 className="animate-spin" /> : <Bot />}
                                Review
                            </Button>
                        </div>
                        <Button 
                            variant="default"
                            onClick={handleAcceptAnswer}
                            disabled={!currentAnswer || isGenerating || isReviewing || !canEdit}
                        >
                            <CheckCircle2 className="mr-2" />
                            Accept Answer
                        </Button>
                    </div>

                    {review && (
                        <Alert variant="secondary">
                        <Bot className="h-4 w-4" />
                        <AlertTitle>AI Expert Review</AlertTitle>
                        <AlertDescription className="text-sm font-mono whitespace-pre-wrap">
                            {review}
                        </AlertDescription>
                        </Alert>
                    )}
                    {sources.length > 0 && (
                        <Alert variant="secondary">
                        <BookOpenCheck className="h-4 w-4" />
                        <AlertTitle>Sources Used</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc list-inside text-xs font-mono">
                            {sources.map((source, index) => (
                                <li key={index}>{source}</li>
                            ))}
                            </ul>
                            {confidence !== null && (
                            <div className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap text-muted-foreground pt-2 mt-2 border-t border-muted-foreground/20">
                                {confidence > 0.8 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                                <span>Confidence Score: {(confidence * 100).toFixed(0)}%</span>
                            </div>
                            )}
                        </AlertDescription>
                        </Alert>
                    )}
                </div>
                <div className="md:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                       <h4 className="font-semibold text-sm flex items-center gap-2"><MessageSquare /> Comments</h4>
                       <span className="text-xs text-muted-foreground">2 comments</span>
                    </div>
                    <div className="space-y-3">
                         <div className="flex items-start gap-2 text-sm">
                            <Avatar className="h-6 w-6"><AvatarImage src="https://placehold.co/100x100" /><AvatarFallback>PG</AvatarFallback></Avatar>
                            <div><span className="font-medium">Priya</span>: Good start, but let's add pricing for the premium support tier.</div>
                        </div>
                         <div className="flex items-start gap-2 text-sm">
                            <Avatar className="h-6 w-6"><AvatarImage src="https://placehold.co/100x100" /><AvatarFallback>AJ</AvatarFallback></Avatar>
                            <div><span className="font-medium">Alex</span>: Good point, updated.</div>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <Input placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
                        <Button variant="outline" size="sm" disabled={!comment.trim()}>Send</Button>
                    </div>

                     <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><History /> Activity</h4>
                        <ul className="text-xs text-muted-foreground space-y-1.5">
                            <li><span className="font-medium text-foreground">Alex</span> generated an answer <span className="italic">2 hours ago</span></li>
                            <li><span className="font-medium text-foreground">Maria</span> assigned this to <span className="font-medium text-foreground">Alex</span> <span className="italic">4 hours ago</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  )
});
