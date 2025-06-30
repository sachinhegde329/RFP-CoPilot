
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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


type Question = {
  id: number
  question: string
  category: string
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
  const { id, question, category, compliance, assignee, status } = questionData;
  const { tenant } = useTenant();
  const { toast } = useToast();
  
  const [answer, setAnswer] = useState("")
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
      setAnswer(result.answer || "")
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
          <Badge variant="secondary" className="text-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Passed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <ShieldCheck className="mr-1 h-3 w-3" /> Pending
          </Badge>
        )
    }
  }

  return (
    <>
      <Card className={isEditingDisabled ? "bg-muted/30" : ""}>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-base font-medium flex-1">
              {`Q${id}: ${question}`}
            </CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="hidden sm:flex items-center">
                <Tag className="mr-1 h-3 w-3" />
                {category}
              </Badge>
              <ComplianceBadge />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
                onChange={(e) => setAnswer(e.target.value)}
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
            <div className="flex items-center gap-2">
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
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-muted/50 p-3 border-t">
          <div className="flex items-center gap-2">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-8 px-2 text-xs sm:text-sm sm:px-3" disabled={isEditingDisabled}>
                        {assignee ? (
                            <>
                                <Avatar className="h-5 w-5 mr-0 sm:mr-2">
                                    {assignee.avatar && <AvatarImage src={assignee.avatar} alt={assignee.name} />}
                                    <AvatarFallback className="text-xs">{assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="hidden sm:inline-block truncate max-w-[100px]">{assignee.name}</span>
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4 mr-0 sm:mr-2"/>
                                <span className="hidden sm:inline-block">Assign</span>
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
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

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-accent" disabled={isEditingDisabled}>
                          <StatusIcon status={status} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Set status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
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
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">{status}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

             <Button variant="ghost" size="icon" onClick={() => setIsCommentSheetOpen(true)} className="text-muted-foreground hover:text-foreground h-8 w-8 relative">
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">Comments</span>
                {comments.length > 0 && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {comments.length}
                    </div>
                )}
            </Button>
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
        </CardFooter>
      </Card>
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
