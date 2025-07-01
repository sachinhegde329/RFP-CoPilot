
'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTenant } from "@/components/providers/tenant-provider"
import { RfpSummaryCard } from "@/components/dashboard/rfp-summary-card"
import { QAndAList } from "@/components/dashboard/q-and-a-list"
import { ComplianceCard } from "@/components/dashboard/compliance-card"
import { extractQuestionsAction, updateQuestionAction, addQuestionAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Bot, PlusCircle, Download } from "lucide-react"
import type { TeamMember } from "@/lib/tenant-types"
import type { Question, RFP } from "@/lib/rfp.service"
import { AttachmentsCard } from "./attachments-card"
import { RfpSelector } from "./rfp-selector"

type Attachment = {
  id: number;
  name: string;
  size: string;
  type: string;
  url: string;
};

type HomepageClientProps = {
  rfps: RFP[];
  selectedRfp?: RFP;
}

export function HomepageClient({ rfps, selectedRfp }: HomepageClientProps) {
  const { tenant } = useTenant();
  const router = useRouter();
  const pathname = usePathname();

  const [questions, setQuestions] = useState<Question[]>(selectedRfp?.questions || []);
  const [rfpAttachments, setRfpAttachments] = useState<Record<string, Attachment[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const currentUser = tenant.members[0];
  
  // This effect ensures the questions displayed are always in sync with the selected RFP
  // when the user navigates using the browser's back/forward buttons.
  useEffect(() => {
    setQuestions(selectedRfp?.questions || []);
  }, [selectedRfp]);

  // Clean up ALL Object URLs when the component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(rfpAttachments).flat().forEach(att => URL.revokeObjectURL(att.url));
    }
  }, [rfpAttachments]);


  const handleUpdateQuestion = async (questionId: number, updates: Partial<Question>) => {
    if (!selectedRfp) return;
    
    // Optimistic update
    const originalQuestions = questions;
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    );

    const result = await updateQuestionAction(tenant.id, selectedRfp.id, questionId, updates, currentUser);
    if (result.error) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: result.error,
        });
        // Revert on error
        setQuestions(originalQuestions);
    }
  }

  const handleAddQuestion = async (questionData: Omit<Question, 'id'>) => {
    if (!selectedRfp) return false;

    const result = await addQuestionAction(tenant.id, selectedRfp.id, questionData, currentUser);
    if (result.error || !result.question) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return false;
    } else {
        setQuestions(prev => [...prev, result.question!]);
        toast({ title: 'Question Added' });
        return true;
    }
  };

  const handleProcessRfp = async (rfpText: string, file?: File) => {
    if (!rfpText.trim()) {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please paste your RFP content to extract questions.",
      })
      return
    }
    setIsLoading(true);

    const rfpName = file ? file.name : `Pasted RFP - ${new Date().toLocaleDateString()}`;

    try {
      const result = await extractQuestionsAction(rfpText, rfpName, tenant.id, currentUser);

      if (result.error || !result.rfp) {
        toast({
          variant: "destructive",
          title: "Extraction Error",
          description: result.error || "Could not process RFP",
        });
      } else {
        const newRfp = result.rfp;
        const newRfpId = newRfp.id;
        
        setQuestions(newRfp.questions);

        if (file) {
          const newAttachment: Attachment = {
            id: Date.now(),
            name: file.name,
            size: file.size > 1024 * 1024 
                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                : `${(file.size / 1024).toFixed(0)} KB`,
            type: file.type,
            url: URL.createObjectURL(file),
          };
          setRfpAttachments(prev => ({ ...prev, [newRfpId]: [newAttachment] }));
        }
        
        toast({ title: "RFP Processed", description: `Created new RFP: ${newRfp.name}` });
        
        router.push(`${pathname}?rfpId=${newRfpId}`);
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "An Unexpected Error Occurred",
        description: "Failed to process the RFP. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpdateAttachments = (updatedAttachments: Attachment[]) => {
    if (!selectedRfp) return;

    // Revoke URLs for attachments that are being removed to prevent memory leaks
    const currentAttachments = rfpAttachments[selectedRfp.id] || [];
    currentAttachments.forEach(att => {
        if (!updatedAttachments.some(updatedAtt => updatedAtt.id === att.id)) {
            URL.revokeObjectURL(att.url);
        }
    });

    setRfpAttachments(prev => ({
      ...prev,
      [selectedRfp.id]: updatedAttachments,
    }));
  };

  if (!selectedRfp) {
    return (
      <div className="space-y-6">
        <RfpSummaryCard
          isLoading={isLoading}
          onProcessRfp={handleProcessRfp}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                  <CardTitle>Extracted Questions</CardTitle>
                  <CardDescription>
                      Filter, assign, and answer the questions for this RFP.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg min-h-[200px]">
                    <FileText className="size-12 text-muted-foreground" />
                    <h3 className="font-semibold">Your Questions Will Appear Here</h3>
                    <p className="text-sm text-muted-foreground max-w-md">Once you provide an RFP in the card above, we'll use AI to extract and list all the questions for you to answer.</p>
                  </div>
              </CardContent>
            </Card>
           </div>
        </div>
      </div>
    )
  }

  const attachments = rfpAttachments[selectedRfp.id] || [];

  return (
    <div className="space-y-6">
      <RfpSelector rfps={rfps} selectedRfpId={selectedRfp.id} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <RfpSummaryCard
            isLoading={isLoading}
            onProcessRfp={handleProcessRfp}
          />
        </div>
        <div className="lg:col-span-2">
          {isLoading && questions.length === 0 ? (
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <CardTitle>Extracted Questions</CardTitle>
                            <CardDescription>
                                Filter, assign, and answer the questions for this RFP.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" disabled>
                                <PlusCircle className="mr-2" />
                                Add Question
                            </Button>
                            <Button variant="default" disabled>
                                <Download className="mr-2" />
                                Export RFP
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg min-h-[200px]">
                        <Bot className="size-12 animate-pulse text-primary" />
                        <p className="font-medium">AI is extracting questions...</p>
                        <p className="text-sm text-muted-foreground max-w-md">This may take a moment. The questions will appear here once ready.</p>
                    </div>
                </CardContent>
            </Card>
          ) : questions.length > 0 ? (
            <QAndAList 
              questions={questions} 
              tenantId={tenant.id}
              rfpId={selectedRfp.id}
              members={tenant.members} 
              onUpdateQuestion={handleUpdateQuestion}
              onAddQuestion={handleAddQuestion}
            />
          ) : !isLoading ? (
            <Card>
              <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                          <CardTitle>Extracted Questions</CardTitle>
                          <CardDescription>
                              Filter, assign, and answer the questions for this RFP.
                          </CardDescription>
                      </div>
                      <div className="flex gap-2">
                          <Button variant="outline" disabled>
                              <PlusCircle className="mr-2" />
                              Add Question
                          </Button>
                          <Button variant="default" disabled>
                              <Download className="mr-2" />
                              Export RFP
                          </Button>
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg min-h-[200px]">
                    <FileText className="size-12 text-muted-foreground" />
                    <h3 className="font-semibold">Your Questions Will Appear Here</h3>
                    <p className="text-sm text-muted-foreground max-w-md">Once you provide an RFP in the card above, we'll use AI to extract and list all the questions for you to answer.</p>
                  </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
        <div className="lg:col-span-1 space-y-6">
          <AttachmentsCard 
              attachments={attachments}
              onUpdateAttachments={handleUpdateAttachments}
          />
          <ComplianceCard />
        </div>
      </div>
    </div>
  )
}
