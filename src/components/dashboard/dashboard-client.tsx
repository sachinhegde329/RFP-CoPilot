
'use client'

import { useState, useEffect } from "react"
import { useTenant } from "@/components/providers/tenant-provider"
import { RfpSummaryCard } from "@/components/dashboard/rfp-summary-card"
import { QAndAList } from "@/components/dashboard/q-and-a-list"
import { ComplianceCard } from "@/components/dashboard/compliance-card"
import { extractQuestionsAction, updateQuestionAction, addQuestionAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Bot } from "lucide-react"
import type { TeamMember } from "@/lib/tenants"
import type { Question } from "@/lib/rfp.service"
import { AttachmentsCard } from "./attachments-card"

type Attachment = {
  id: number;
  name: string;
  size: string;
  type: string;
  url: string;
};

type DashboardClientProps = {
  initialQuestions: Question[];
}

export function DashboardClient({ initialQuestions }: DashboardClientProps) {
  const { tenant } = useTenant();

  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const currentUser = tenant.members[0];

  // Clean up Object URLs when the component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      attachments.forEach(att => URL.revokeObjectURL(att.url));
    }
  }, [attachments]);


  const handleUpdateQuestion = async (questionId: number, updates: Partial<Question>) => {
    // Optimistic update
    const originalQuestions = questions;
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    );

    const result = await updateQuestionAction(tenant.id, questionId, updates, currentUser);
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
    const result = await addQuestionAction(tenant.id, questionData, currentUser);
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
    setIsLoading(true)
    setQuestions([])

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
      setAttachments([newAttachment]);
    } else {
      setAttachments([]); // Clear attachments if it's pasted text
    }


    try {
      const questionsResult = await extractQuestionsAction(rfpText, tenant.id, currentUser)

      if (questionsResult.error) {
        toast({
          variant: "destructive",
          title: "Question Extraction Error",
          description: questionsResult.error,
        })
      } else {
        setQuestions(questionsResult.questions || [])
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "An Unexpected Error Occurred",
        description: "Failed to process the RFP. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAttachments = (updatedAttachments: Attachment[]) => {
    // Revoke URLs for attachments that are being removed to prevent memory leaks
    attachments.forEach(att => {
        if (!updatedAttachments.some(updatedAtt => updatedAtt.id === att.id)) {
            URL.revokeObjectURL(att.url);
        }
    });
    setAttachments(updatedAttachments);
  };


  return (
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
             <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                   <Bot className="size-12 animate-pulse text-primary" />
                   <p className="font-medium">AI is extracting questions...</p>
                   <p className="text-sm text-muted-foreground">This may take a moment. The questions will appear here once ready.</p>
                </div>
             </CardContent>
           </Card>
        ) : questions.length > 0 ? (
          <QAndAList 
            questions={questions} 
            tenantId={tenant.id} 
            members={tenant.members} 
            onUpdateQuestion={handleUpdateQuestion}
            onAddQuestion={handleAddQuestion}
          />
        ) : !isLoading ? (
           <Card>
             <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                   <FileText className="size-12 text-muted-foreground" />
                   <h3 className="font-semibold">Your Questions Will Appear Here</h3>
                   <p className="text-sm text-muted-foreground">Once you provide an RFP in the card above, we'll use AI to extract and list all the questions for you to answer.</p>
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
  )
}
