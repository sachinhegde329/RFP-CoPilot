
'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTenant } from "@/components/providers/tenant-provider"
import { QAndAList } from "@/components/dashboard/q-and-a-list"
import { getRfpsAction, updateQuestionAction, addQuestionAction, generateAnswerAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Question, RFP } from "@/lib/rfp-types"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { PlusCircle, Sparkles, Upload, Loader2 } from "lucide-react"
import { ExportRfpDialog } from "./export-rfp-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RfpSelector } from "./rfp-selector"
import { Checkbox } from "@/components/ui/checkbox"

function RfpWorkspaceView() {
  const { tenant } = useTenant();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [selectedRfp, setSelectedRfp] = useState<RFP | undefined>();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isAutogenDialogOpen, setIsAutogenDialogOpen] = useState(false);

  // Autogen settings state
  const [autogenLanguage, setAutogenLanguage] = useState('English');
  const [autogenTone, setAutogenTone] = useState(tenant.defaultTone || 'Formal');
  const [autogenStyle, setAutogenStyle] = useState('a paragraph');
  const [autogenLength, setAutogenLength] = useState('medium-length');
  const [autogenTags, setAutogenTags] = useState(true);


  const [questions, setQuestions] = useState<Question[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const { toast } = useToast();

  const currentUser = tenant.members[0];

  useEffect(() => {
    async function fetchInitialData() {
        setIsDataLoading(true);
        const result = await getRfpsAction(tenant.id);
        
        if (result.rfps) {
            setRfps(result.rfps);
        } else {
            toast({ variant: "destructive", title: "Error", description: "Could not load RFP data." });
        }
        setIsDataLoading(false);
    }
    fetchInitialData();
  }, [tenant.id, toast]);

  useEffect(() => {
    const rfpIdFromUrl = searchParams.get('rfpId');
    if (rfps.length > 0) {
        const rfpToSelect = rfps.find(r => r.id === rfpIdFromUrl) || rfps[0];
        setSelectedRfp(rfpToSelect);
        setQuestions(rfpToSelect?.questions || []);
    } else {
        setSelectedRfp(undefined);
        setQuestions([]);
    }
  }, [searchParams, rfps]);

  const handleUpdateQuestion = useCallback(async (questionId: number, updates: Partial<Question>) => {
    if (!selectedRfp) return;
    
    // Optimistically update UI
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q));
    setRfps(prev => prev.map(r => 
        r.id === selectedRfp.id 
        ? { ...r, questions: r.questions.map(q => q.id === questionId ? { ...q, ...updates } : q) } 
        : r
    ));

    const result = await updateQuestionAction(tenant.id, selectedRfp.id, questionId, updates, currentUser);
    if (result.error) {
        toast({ variant: "destructive", title: "Update Failed", description: result.error });
    }
  }, [selectedRfp, tenant.id, currentUser, toast]);

  const handleAddQuestion = useCallback(async (questionData: Omit<Question, 'id'>) => {
    if (!selectedRfp) return false;

    const result = await addQuestionAction(tenant.id, selectedRfp.id, questionData, currentUser);
    if (result.error || !result.question) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return false;
    } else {
        const newQuestion = result.question;
        setQuestions(prev => [...prev, newQuestion]);
        setRfps(prev => prev.map(r => r.id === selectedRfp.id ? { ...r, questions: [...r.questions, newQuestion] } : r));
        toast({ title: 'Question Added' });
        return true;
    }
  }, [selectedRfp, tenant.id, currentUser, toast]);

  const unansweredQuestions = useMemo(() => {
    return selectedRfp?.questions.filter(q => !q.answer) || [];
  }, [selectedRfp]);

  const handleAutogenerateAll = async () => {
    if (!selectedRfp || unansweredQuestions.length === 0) return;

    setIsAutoGenerating(true);
    setIsAutogenDialogOpen(false);
    toast({
      title: "Autogeneration Started",
      description: `Attempting to generate answers for ${unansweredQuestions.length} questions. This may take a few moments.`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const question of unansweredQuestions) {
      const result = await generateAnswerAction({
        question: question.question,
        rfpId: selectedRfp.id,
        tenantId: tenant.id,
        currentUser,
        language: autogenLanguage,
        tone: autogenTone,
        style: autogenStyle,
        length: autogenLength,
        autogenerateTags: autogenTags,
      });

      if (result.error) {
        console.error(`Failed to generate answer for Q${question.id}:`, result.error);
        errorCount++;
      } else if (result.answer) {
        // This will optimistically update the UI and save to the backend.
        const updates: Partial<Question> = { answer: result.answer, status: 'Completed' };
        if (result.tags && result.tags.length > 0) {
            const existingTags = new Set(question.tags || []);
            result.tags.forEach(tag => existingTags.add(tag));
            updates.tags = Array.from(existingTags);
        }
        await handleUpdateQuestion(question.id, updates);
        successCount++;
      }
    }

    setIsAutoGenerating(false);
    toast({
      title: "Autogeneration Complete",
      description: `Generated ${successCount} answers. Failed on ${errorCount} questions.`,
    });
  };

  if (isDataLoading) {
    return <DashboardSkeleton />;
  }
  
  const progressPercentage = selectedRfp?.questions ? (selectedRfp.questions.filter(q => q.status === 'Completed').length / selectedRfp.questions.length) * 100 : 0;

    return (
      <>
        <main className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
           {selectedRfp ? (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 border-b pb-6">
                        <div className="flex-1 space-y-2">
                           <RfpSelector rfps={rfps} selectedRfpId={selectedRfp.id} />
                           <div className="flex items-center gap-4 pt-1">
                                <Progress value={progressPercentage} className="h-2 w-full max-w-sm" />
                                <p className="text-sm text-muted-foreground whitespace-nowrap">{Math.round(progressPercentage)}% complete</p>
                           </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                           <Button onClick={() => setIsAutogenDialogOpen(true)} disabled={isAutoGenerating || !selectedRfp}>
                                {isAutoGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2"/>}
                                {isAutoGenerating ? 'Generating...' : 'Autogenerate All'}
                           </Button>
                           <Button variant="outline" onClick={() => selectedRfp && setIsExportDialogOpen(true)} disabled={!selectedRfp}>Export</Button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-y-auto -mr-6 pr-6">
                        <QAndAList 
                            key={selectedRfp.id}
                            questions={questions} 
                            tenantId={tenant.id}
                            rfpId={selectedRfp.id}
                            members={tenant.members} 
                            onUpdateQuestion={handleUpdateQuestion}
                            onAddQuestion={handleAddQuestion}
                            onOpenAutogenSettings={() => setIsAutogenDialogOpen(true)}
                            />
                    </div>
                </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <h3 className="text-2xl font-bold">Welcome to RFP CoPilot</h3>
                  <p className="text-muted-foreground">Select an RFP from the list or upload a new one to get started.</p>
                  <Button className="mt-4"><Upload className="mr-2"/> Upload New RFP</Button>
                </div>
              </div>
            )}
        </main>
        {selectedRfp && <ExportRfpDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} rfp={selectedRfp} />}
        
        <Dialog open={isAutogenDialogOpen} onOpenChange={setIsAutogenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Autogenerate Settings</DialogTitle>
              <DialogDescription>
                Configure the settings for generating answers for all {unansweredQuestions.length} unanswered questions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={autogenLanguage} onValueChange={setAutogenLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Mandarin Chinese">Mandarin Chinese</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                      <SelectItem value="Portuguese">Portuguese</SelectItem>
                      <SelectItem value="Bengali">Bengali</SelectItem>
                      <SelectItem value="Russian">Russian</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="Punjabi">Punjabi</SelectItem>
                      <SelectItem value="Javanese">Javanese</SelectItem>
                      <SelectItem value="Korean">Korean</SelectItem>
                      <SelectItem value="Turkish">Turkish</SelectItem>
                      <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                      <SelectItem value="Marathi">Marathi</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={autogenTone} onValueChange={setAutogenTone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Consultative">Consultative</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                  <Label>Answer Style</Label>
                  <RadioGroup value={autogenStyle} onValueChange={setAutogenStyle} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="a paragraph" id="style-para" />
                          <Label htmlFor="style-para">Paragraph</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bullet points" id="style-bullets" />
                          <Label htmlFor="style-bullets">Bullet Points</Label>
                      </div>
                  </RadioGroup>
              </div>
               <div className="space-y-2">
                  <Label>Answer Length</Label>
                  <RadioGroup value={autogenLength} onValueChange={setAutogenLength} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="short" id="len-short" />
                          <Label htmlFor="len-short">Short</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium-length" id="len-med" />
                          <Label htmlFor="len-med">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="detailed" id="len-long" />
                          <Label htmlFor="len-long">Detailed</Label>
                      </div>
                  </RadioGroup>
              </div>
               <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="autogen-tags" checked={autogenTags} onCheckedChange={(checked) => setAutogenTags(Boolean(checked))} />
                    <Label htmlFor="autogen-tags">Automatically generate tags</Label>
                  </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAutogenerateAll} disabled={isAutoGenerating || unansweredQuestions.length === 0}>
                {isAutoGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                {isAutoGenerating ? 'Generating...' : `Generate ${unansweredQuestions.length} Answers`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
}

export function HomepageClient() {
  return <RfpWorkspaceView />;
}
