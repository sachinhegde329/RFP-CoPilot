
"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, ShieldCheck, CheckCircle2, XCircle, History, Loader2, Bot, Clipboard, ClipboardCheck, Tag, BookOpenCheck, UserPlus, Circle, CheckCircle, CircleDotDashed, Bold, Italic, Underline, List, MessageSquare, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAnswerAction, reviewAnswerAction } from "@/app/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTenant } from "@/components/providers/tenant-provider"
import { hasFeatureAccess } from "@/lib/access-control"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { TeamMember } from "@/lib/tenants"
import { Input } from "../ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"


type Question = {
  id: number
  question: string
  category: string
  answer: string
  compliance: "passed" | "failed" | "pending"
  assignee?: TeamMember | null
  status: 'Unassigned' | 'In Progress' | 'Completed'
}

type QAndAItemProps = {
  questionData: Question
  tenantId: string
  members: TeamMember[]
  isLocked: boolean
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => void
}

export function QAndAItem({ questionData, tenantId, members, isLocked, onUpdateQuestion }: QAndAItemProps) {
  const { id, question, category, compliance, assignee, status, answer } = questionData;
  const { tenant } = useTenant();
  const { toast } = useToast();
  
  const [sources, setSources] = useState<string[]>([])
  const [review, setReview] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false)
  const canUseAiReview = hasFeatureAccess(tenant, 'aiExpertReview');
  const currentUser = tenant.members[0];

  const isEditor = currentUser.role === 'Editor';
  const isEditingDisabled = isLocked && isEditor;

  const mockComments = [
    { id: 1, author: members[1] || members[0], timestamp: '2 hours ago', content: 'Good start, but can we clarify the part about data residency?' },
    { id: 2, author: members[0], timestamp: '1 hour ago', content: 'Good point. I\'ve updated the answer to specify that data is stored in the US.' },
  ];
  const [comments, setComments] = useState(mockComments);
  const [newComment, setNewComment] = useState("");

  const contributors = useMemo(() => {
    const contributorIds = new Set<number>();
    if (assignee) {
        contributorIds.add(assignee.id);
    }
    comments.forEach(comment => contributorIds.add(comment.author.id));
    
    return Array.from(contributorIds)
        .map(id => members.find(m => m.id === id))
        .filter((m): m is TeamMember => !!m);
  }, [assignee, comments, members]);

  const handleGenerateAnswer = async () => {
    setIsGenerating(true)
    setReview("")
    setSources([])
    
    const result = await generateAnswerAction(question, tenantId)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    } else {
      onUpdateQuestion(id, { answer: result.answer || "" });
      setSources(result.sources || [])
    }
    setIsGenerating(false)
  }

  const handleReviewAnswer = async () => {
    if (!answer) {
      toast({
        variant: "destructive",
        title: "Cannot Review",
        description: "Please provide an answer before requesting a review.",
      })
      return
    }
    setIsReviewing(true)
    const result = await reviewAnswerAction(question, answer, tenant.id)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    } else {
      setReview(result.review || "")
    }
    setIsReviewing(false)
  }
  
  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  const handleAssigneeChange = (memberId: string) => {
    if (isEditingDisabled) return;
    const member = members.find(m => m.id.toString() === memberId) || null;
    onUpdateQuestion(id, { assignee: member });
  };

  const handleStatusChange = (newStatus: Question['status']) => {
    if (isEditingDisabled) return;
    onUpdateQuestion(id, { status: newStatus });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentToAdd = {
        id: comments.length + 1,
        author: currentUser,
        timestamp: 'Just now',
        content: newComment,
    };
    setComments([...comments, commentToAdd]);
    setNewComment("");
  };

  const StatusIcon = ({ status, className }: { status: Question['status'], className?: string }) => {
    switch (status) {
      case 'Completed': return <CheckCircle className={className || "h-4 w-4 text-green-600"} />;
      case 'In Progress': return <CircleDotDashed className={className || "h-4 w-4 text-yellow-600"} />;
      case 'Unassigned':
      default: return <Circle className={className || "h-4 w-4 text-muted-foreground"} />;
    }
  };

  const ComplianceBadge = () => {
    switch (compliance) {
      case "passed":
        return (
          <Badge variant="secondary" className="text-green-600 whitespace-nowrap">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Passed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="whitespace-nowrap">
            <XCircle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="whitespace-nowrap">
            <ShieldCheck className="mr-1 h-3 w-3" /> Pending
          </Badge>
        )
    }
  }

  return (
    <>
      <AccordionItem value={`item-${id}`} className={cn(isEditingDisabled && "bg-muted/30 cursor-not-allowed")}>
        <AccordionTrigger className="p-4 text-left hover:no-underline [&[data-state=open]]:bg-muted/50">
          <div className="flex-1 flex items-start gap-4 mr-4">
            <span className="text-sm font-semibold text-primary mt-px">{`Q${id}`}</span>
            <p className="font-normal text-sm leading-snug flex-1">{question}</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button onClick={(e) => e.stopPropagation()} className={cn("flex h-6 w-6 items-center justify-center rounded-full", isEditingDisabled ? "cursor-not-allowed" : "hover:bg-accent/50")} disabled={isEditingDisabled}>
                                <StatusIcon status={status} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent><p>Change status: {status}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleStatusChange('Unassigned')}>
                  <Circle className="mr-2 h-4 w-4 text-muted-foreground" />
                  Unassigned
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleStatusChange('In Progress')}>
                  <CircleDotDashed className="mr-2 h-4 w-4 text-yellow-600" />
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleStatusChange('Completed')}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Completed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button onClick={(e) => e.stopPropagation()} className={cn("flex h-6 w-6 items-center justify-center rounded-full", isEditingDisabled ? "cursor-not-allowed" : "hover:bg-accent/50")} disabled={isEditingDisabled}>
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
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent><p>{assignee ? `Assigned to ${assignee.name}` : 'Unassigned'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <ComplianceBadge />
            
            {comments.length > 0 && (
              <div className="hidden lg:flex items-center gap-1 text-muted-foreground text-sm">
                <MessageSquare className="h-4 w-4" />
                <span>{comments.length}</span>
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-2">
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="p-2 border-b flex items-center gap-1">
                <Button variant="ghost" size="icon" disabled={isEditingDisabled}><Bold /></Button>
                <Button variant="ghost" size="icon" disabled={isEditingDisabled}><Italic /></Button>
                <Button variant="ghost" size="icon" disabled={isEditingDisabled}><Underline /></Button>
                <Button variant="ghost" size="icon" disabled={isEditingDisabled}><List /></Button>
              </div>
              <div className="relative">
                <Textarea
                  placeholder="Draft your answer here..."
                  value={answer}
                  onChange={(e) => onUpdateQuestion(id, { answer: e.target.value })}
                  className="min-h-[120px] w-full resize-y border-0 pr-10 focus-visible:ring-0"
                  disabled={isEditingDisabled}
                />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
                  {isCopied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  <span className="sr-only">Copy</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleGenerateAnswer} disabled={isGenerating || isEditingDisabled}>
                  {isGenerating ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Sparkles />
                  )}
                  Generate Answer
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReviewAnswer}
                  disabled={isReviewing || !answer || !canUseAiReview || isEditingDisabled}
                >
                  {isReviewing ? <Loader2 className="animate-spin" /> : <Bot />}
                  AI Expert Review
                </Button>
                 <Button
                    variant="outline"
                    onClick={() => handleStatusChange('Completed')}
                    disabled={status === 'Completed' || isEditingDisabled}
                >
                    <CheckCircle />
                    Mark as Complete
                </Button>
              </div>
            </div>
            {review && (
              <Alert>
                <Bot className="h-4 w-4" />
                <AlertTitle>AI Expert Review</AlertTitle>
                <AlertDescription className="prose prose-sm max-w-none">
                  {review}
                </AlertDescription>
              </Alert>
            )}
            {sources.length > 0 && (
              <Alert variant="secondary">
                <BookOpenCheck className="h-4 w-4" />
                <AlertTitle>Sources Used</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-xs">
                    {sources.map((source, index) => (
                        <li key={index}>{source}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div className="flex items-center gap-4">
                 <Button variant="ghost" size="sm" onClick={() => setIsCommentSheetOpen(true)} className="text-muted-foreground hover:text-foreground relative">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                    {comments.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{comments.length}</Badge>
                    )}
                </Button>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Contributors:</span>
                    <div className="flex items-center -space-x-2">
                        {contributors.map(c => (
                            <TooltipProvider key={c.id} delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="focus:outline-none">
                                            <Avatar className="h-6 w-6 border-2 border-background">
                                                {c.avatar && <AvatarImage src={c.avatar} alt={c.name} />}
                                                <AvatarFallback className="text-xs">{c.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>{c.name}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <Select defaultValue="v3" disabled={isEditingDisabled}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="v3">Version 3</SelectItem>
                    <SelectItem value="v2">Version 2</SelectItem>
                    <SelectItem value="v1">Version 1</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <Sheet open={isCommentSheetOpen} onOpenChange={setIsCommentSheetOpen}>
        <SheetContent className="flex flex-col gap-0 sm:max-w-lg">
          <SheetHeader className="p-6">
            <SheetTitle>Comments on Q{id}</SheetTitle>
            <SheetDescription className="line-clamp-3 text-left">
              {question}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-4 p-6 pt-0">
            {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        {comment.author.avatar && <AvatarImage src={comment.author.avatar} alt={comment.author.name} />}
                        <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">{comment.author.name}</span>
                            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-2 border-t bg-background p-4">
              <Avatar className="h-8 w-8">
                {currentUser.avatar && <AvatarImage src={currentUser.avatar} alt={currentUser.name} />}
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Input 
                  placeholder="Add a comment..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
              />
              <Button onClick={handleAddComment} size="icon" disabled={!newComment.trim()}>
                  <Send />
                  <span className="sr-only">Send comment</span>
              </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
