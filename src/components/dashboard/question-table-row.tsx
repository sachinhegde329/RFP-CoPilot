
"use client"

import { useState, useMemo, memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, CheckCircle2, AlertTriangle, History, Loader2, Bot, Clipboard, ClipboardCheck, BookOpenCheck, UserPlus, Circle, CheckCircle, CircleDotDashed, Bold, Italic, Underline, List, MessageSquare, Send } from "lucide-react"
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableRow, TableCell } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { Question } from "@/lib/rfp-types";

type QuestionTableRowProps = {
  questionData: Question
  tenantId: string
  rfpId: string
  members: TeamMember[]
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => void
  isSelected: boolean
  onSelectChange: (questionId: number, isSelected: boolean) => void
  canEdit: boolean
}

export const QuestionTableRow = memo(function QuestionTableRow({ questionData, tenantId, rfpId, members, onUpdateQuestion, isSelected, onSelectChange, canEdit }: QuestionTableRowProps) {
  const { id, question, category, assignee, status, answer } = questionData;
  const { tenant } = useTenant();
  const { toast } = useToast();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const currentUser = tenant.members[0];
  const canUseAiReview = hasFeatureAccess(tenant, 'aiExpertReview');
  const canAssign = canPerformAction(currentUser.role, 'assignQuestions');

  const mockComments = [
    { id: 1, author: members[1] || members[0], timestamp: '2 hours ago', content: 'Good start, but can we clarify the part about data residency?' },
    { id: 2, author: members[0], timestamp: '1 hour ago', content: 'Good point. I\'ve updated the answer to specify that data is stored in the US.' },
  ];
  const [comments, setComments] = useState(mockComments);
  const [newComment, setNewComment] = useState("");

  const contributors = useMemo(() => {
    const contributorIds = new Set<string>();
    if (assignee) {
        contributorIds.add(assignee.id);
    }
    comments.forEach(comment => contributorIds.add(comment.author.id));
    
    return Array.from(contributorIds)
        .map(id => members.find(m => m.id === id))
        .filter((m): m is TeamMember => !!m);
  }, [assignee, comments, members]);

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
      onUpdateQuestion(id, { answer: result.answer || "" });
      setSources(result.sources || []);
      setConfidence(result.confidenceScore || null);
    }
    setIsGenerating(false);
  };

  const handleReviewAnswer = async () => {
    if (!answer) {
      toast({
        variant: "destructive",
        title: "Cannot Review",
        description: "Please provide an answer before requesting a review.",
      });
      return;
    }
    setIsReviewing(true);
    const result = await reviewAnswerAction(question, answer, tenant.id, currentUser);
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
    navigator.clipboard.writeText(answer);
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

  return (
    <>
      <TableRow onClick={() => setIsSheetOpen(true)} className="cursor-pointer text-sm">
        <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange(id, !!checked)}
            aria-labelledby={`q-label-${id}`}
            disabled={!canEdit}
          />
        </TableCell>
        <TableCell className="font-medium pr-0">
          <span id={`q-label-${id}`}>{question}</span>
        </TableCell>
        <TableCell className="hidden md:table-cell">{category}</TableCell>
        <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
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
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto p-1 font-normal capitalize flex items-center gap-1" disabled={!canEdit}>
                <StatusIcon status={status} />
                {status}
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
        </TableCell>
      </TableRow>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex flex-col gap-0 sm:max-w-2xl p-0">
          <SheetHeader className="p-6">
            <SheetTitle>Q{id}: {question}</SheetTitle>
            <SheetDescription>
              Category: <Badge variant="outline">{category}</Badge>
            </SheetDescription>
          </SheetHeader>
          <Tabs defaultValue="answer" className="flex flex-col flex-1 min-h-0">
              <TabsList className="mx-6">
                  <TabsTrigger value="answer">Answer</TabsTrigger>
                  <TabsTrigger value="activity">Comments & Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="answer" className="flex-1 overflow-y-auto p-6 space-y-4">
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
                        value={answer}
                        onChange={(e) => onUpdateQuestion(id, { answer: e.target.value })}
                        className="min-h-[150px] w-full resize-y border-0 pr-10 focus-visible:ring-0"
                        disabled={!canEdit}
                      />
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
                        {isCopied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                        <span className="sr-only">Copy</span>
                      </Button>
                    </div>
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
              </TabsContent>
              
              <TabsContent value="activity" className="flex-1 overflow-y-auto p-6 space-y-6">
                 <div className="space-y-4">
                    <h3 className="font-semibold">Comments</h3>
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

                  <div className="space-y-4">
                    <h3 className="font-semibold">Activity</h3>
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">Contributors:</span>
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
                     <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">Version:</span>
                        <Select defaultValue="v3">
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
              </TabsContent>

              <SheetFooter className="p-6 pt-0 flex-col-reverse sm:flex-row sm:justify-between items-center gap-4">
                <div className="flex items-center gap-2 w-full">
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
                        <Send /><span className="sr-only">Send comment</span>
                    </Button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                    <Button onClick={handleGenerateAnswer} disabled={isGenerating || !canEdit} className="w-full">
                      {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                      Generate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReviewAnswer}
                      disabled={isReviewing || !answer || !canUseAiReview || !canEdit}
                      className="w-full"
                    >
                      {isReviewing ? <Loader2 className="animate-spin" /> : <Bot />}
                      Review
                    </Button>
                </div>
              </SheetFooter>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
});
