
"use client"

import { useState, memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sparkles, CheckCircle2, AlertTriangle, Bot, Clipboard, ClipboardCheck, BookOpenCheck, UserPlus, Bold, Italic, Underline, List, MessageSquare, PlusCircle, X, Settings, Library, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAnswerAction, reviewAnswerAction, saveToLibraryAction } from "@/app/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTenant } from "@/components/providers/tenant-provider"
import { hasFeatureAccess, canPerformAction } from "@/lib/access-control"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Question } from "@/lib/rfp-types";
import { Checkbox } from "@/components/ui/checkbox"
import { TeamMember } from "@/lib/tenant-types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "../ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"


type QAndAItemProps = {
  questionData: Question
  tenantId: string
  rfpId: string
  members: TeamMember[]
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => void
}

export const QAndAItem = memo(function QAndAItem({ questionData, tenantId, rfpId, members, onUpdateQuestion }: QAndAItemProps) {
  const { id, question, assignee, status, answer, tags, category } = questionData;
  const { tenant } = useTenant();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState(answer);
  const [sources, setSources] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  
  // Generation settings
  const [genLanguage, setGenLanguage] = useState('English');
  const [genTone, setGenTone] = useState(tenant.defaultTone || 'Formal');
  const [genStyle, setGenStyle] = useState('a paragraph');
  const [genLength, setGenLength] = useState('medium-length');
  const [genTags, setGenTags] = useState(true);

  const currentUser = tenant.members[0];
  const canUseAiReview = hasFeatureAccess(tenant, 'aiExpertReview');
  const canEdit = canPerformAction(currentUser.role, 'editContent');
  const canAssign = canPerformAction(currentUser.role, 'assignQuestions');
  
  const handleGenerateAnswer = async () => {
    setIsGenerating(true);
    setReview("");
    setSources([]);
    setConfidence(null);
    
    const result = await generateAnswerAction({
        question, 
        rfpId, 
        tenantId, 
        currentUser,
        language: genLanguage,
        tone: genTone,
        style: genStyle,
        length: genLength,
        autogenerateTags: genTags
    });
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
       if (result.tags && result.tags.length > 0) {
            const existingTags = new Set(tags || []);
            result.tags.forEach(tag => existingTags.add(tag));
            onUpdateQuestion(id, { tags: Array.from(existingTags) });
        }
      if (result.fromLibrary) {
        toast({ title: "Answer Found in Library", description: "This answer was retrieved from your approved Answer Library." });
      }
    }
    setIsGenerating(false);
  };
  
  const handleAcceptAnswer = async () => {
    if (!currentAnswer) {
      toast({ variant: 'destructive', title: 'Cannot Save', description: 'Answer cannot be empty.' });
      return;
    }
    setIsSavingToLibrary(true);
    // This updates the local state optimistically and fires the server action
    onUpdateQuestion(id, { answer: currentAnswer, status: 'Completed' });

    // Now save to the library
    const libraryResult = await saveToLibraryAction({
      tenantId,
      question,
      answer: currentAnswer,
      category,
      tags: tags || [],
      currentUser,
    });
    setIsSavingToLibrary(false);

    if (libraryResult.error) {
      toast({
        variant: 'destructive',
        title: 'Answer saved to RFP, but failed to save to library.',
        description: libraryResult.error,
      });
    } else {
      toast({
        title: 'Answer Saved',
        description: 'The answer has been saved to the RFP and updated in your Answer Library.',
      });
    }
  };

  const handleReviewAnswer = async () => {
    if (!currentAnswer) {
      toast({ variant: "destructive", title: "Cannot Review", description: "Please provide an answer." });
      return;
    }
    setIsReviewing(true);
    const result = await reviewAnswerAction(question, currentAnswer, tenant.id, currentUser);
    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
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
  
  const handleAddTag = () => {
    if (newTagInput.trim() && !(tags || []).includes(newTagInput.trim())) {
      const newTags = [...(tags || []), newTagInput.trim()];
      onUpdateQuestion(id, { tags: newTags });
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = (tags || []).filter(t => t !== tagToRemove);
    onUpdateQuestion(id, { tags: newTags });
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const StatusBadge = ({ status }: { status: Question['status'] }) => {
    const variant = {
      'Completed': 'secondary',
      'In Progress': 'outline',
      'Unassigned': 'outline',
    }[status];
  
    const color = {
      'Completed': 'text-green-400',
      'In Progress': 'text-yellow-400',
      'Unassigned': 'text-muted-foreground',
    }[status];

    return (
      <Badge variant={variant as any} className="capitalize border-border">
        <span className={cn("mr-2 h-2 w-2 rounded-full", {
            'bg-green-400': status === 'Completed',
            'bg-yellow-400': status === 'In Progress',
            'bg-gray-400': status === 'Unassigned',
        })}/>
        {status}
      </Badge>
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-t">
      <CollapsibleTrigger asChild>
        <div className="grid grid-cols-12 gap-4 items-center p-4 cursor-pointer hover:bg-muted/50 text-sm">
          <div className="col-span-8 flex items-center gap-3 md:col-span-6">
            <Checkbox checked={isOpen}/>
            <span className="font-medium">{question}</span>
          </div>
          <div className="hidden md:block col-span-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  disabled={!canAssign}
                  className="flex items-center gap-2 text-left w-full disabled:pointer-events-none"
                >
                  {assignee ? (
                    <>
                      <Avatar className="h-6 w-6">
                        {assignee.avatar && <AvatarImage src={assignee.avatar} alt={assignee.name} />}
                        <AvatarFallback className="text-xs">{assignee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{assignee.name}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => handleAssigneeChange('unassigned')}>Unassigned</DropdownMenuItem>
                <DropdownMenuSeparator />
                {members.map(member => (
                  <DropdownMenuItem key={member.id} onSelect={() => handleAssigneeChange(member.id.toString())}>
                    {member.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="hidden md:block col-span-2">
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="flex flex-wrap gap-1 items-center text-left min-h-[28px] w-full disabled:opacity-70 disabled:pointer-events-none"
                  disabled={!canEdit}
                  onClick={(e) => e.stopPropagation()}
                >
                  {(tags && tags.length > 0) ? (
                    tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">No tags</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Edit Tags</h4>
                    <div className="flex gap-1">
                        <Input 
                            value={newTagInput} 
                            onChange={e => setNewTagInput(e.target.value)} 
                            onKeyDown={handleTagInputKeyDown}
                            placeholder="Add a tag..."
                            className="h-8"
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={handleAddTag}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                    {tags && tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                          {tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                  {tag}
                                  <button onClick={() => handleRemoveTag(tag)} className="ml-1 rounded-full hover:bg-muted-foreground/20 focus:bg-muted-foreground/20 outline-none">
                                      <X className="h-3 w-3" />
                                  </button>
                              </Badge>
                          ))}
                      </div>
                    )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="col-span-4 flex justify-end md:justify-start md:col-span-2">
            <StatusBadge status={status} />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <TooltipProvider>
        <div className="bg-background p-4 space-y-4">
          <div className="rounded-md border bg-card">
              <div className="p-2 border-b flex items-center gap-1">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" disabled={!canEdit}><Bold /></Button></TooltipTrigger><TooltipContent>Bold</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" disabled={!canEdit}><Italic /></Button></TooltipTrigger><TooltipContent>Italic</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" disabled={!canEdit}><Underline /></Button></TooltipTrigger><TooltipContent>Underline</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" disabled={!canEdit}><List /></Button></TooltipTrigger><TooltipContent>Bullet points</TooltipContent></Tooltip>
              </div>
              <div className="relative">
                <Textarea
                  placeholder="Draft your answer here..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="min-h-[150px] w-full resize-y border-0 pr-10 focus-visible:ring-0 bg-card"
                  disabled={!canEdit}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
                      {isCopied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isCopied ? "Copied!" : "Copy Answer"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-between items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={handleGenerateAnswer} disabled={isGenerating || !canEdit} className="w-full sm:w-auto">
                {isGenerating ? "..." : <Sparkles />}
                Generate
              </Button>
               <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isGenerating || !canEdit}>
                            <Settings />
                        </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent><p>Generation Settings</p></TooltipContent>
                </Tooltip>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2"><h4 className="font-medium leading-none">Generation Settings</h4><p className="text-sm text-muted-foreground">Customize the AI's output for this answer.</p></div>
                        <div className="grid gap-2">
                            <div className="grid grid-cols-3 items-center gap-4"><Label>Language</Label><Select value={genLanguage} onValueChange={setGenLanguage}><SelectTrigger className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="English">English</SelectItem><SelectItem value="Spanish">Spanish</SelectItem><SelectItem value="French">French</SelectItem></SelectContent></Select></div>
                            <div className="grid grid-cols-3 items-center gap-4"><Label>Tone</Label><Select value={genTone} onValueChange={setGenTone}><SelectTrigger className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Formal">Formal</SelectItem><SelectItem value="Consultative">Consultative</SelectItem><SelectItem value="Technical">Technical</SelectItem></SelectContent></Select></div>
                             <div className="grid grid-cols-3 items-center gap-4"><Label>Style</Label><RadioGroup value={genStyle} onValueChange={setGenStyle} className="col-span-2 flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="a paragraph" id="style-p" /><Label htmlFor="style-p">Paragraph</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="bullet points" id="style-b" /><Label htmlFor="style-b">Bullets</Label></div></RadioGroup></div>
                            <div className="grid grid-cols-3 items-center gap-4"><Label>Length</Label><RadioGroup value={genLength} onValueChange={setGenLength} className="col-span-2 flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="short" id="len-s" /><Label htmlFor="len-s">Short</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="medium-length" id="len-m" /><Label htmlFor="len-m">Medium</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="detailed" id="len-d" /><Label htmlFor="len-d">Detailed</Label></div></RadioGroup></div>
                            <div className="flex items-center space-x-2 pt-2"><Checkbox id="gen-tags" checked={genTags} onCheckedChange={(c) => setGenTags(Boolean(c))} /><Label htmlFor="gen-tags">Auto-generate tags</Label></div>
                        </div>
                    </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                onClick={handleReviewAnswer}
                disabled={isReviewing || !currentAnswer || !canUseAiReview || !canEdit}
                className="w-full sm:w-auto"
              >
                {isReviewing ? "..." : <Bot />}
                Review
              </Button>
            </div>
            <Button 
              variant="default"
              onClick={handleAcceptAnswer}
              disabled={isSavingToLibrary || !currentAnswer || isGenerating || isReviewing || !canEdit}
            >
              {isSavingToLibrary && <Loader2 className="mr-2 animate-spin" />}
              <CheckCircle2 className="mr-2" />
              Save & Complete
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
        </TooltipProvider>
      </CollapsibleContent>
    </Collapsible>
  )
});
