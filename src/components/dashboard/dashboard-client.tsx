
'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTenant } from "@/components/providers/tenant-provider"
import { RfpSummaryCard } from "@/components/dashboard/rfp-summary-card"
import { QAndAList } from "@/components/dashboard/q-and-a-list"
import { ComplianceCard } from "@/components/dashboard/compliance-card"
import { getRfpsAction, extractQuestionsAction, updateQuestionAction, addQuestionAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText } from "lucide-react"
import type { Question, RFP } from "@/lib/rfp-types"
import { AttachmentsCard } from "./attachments-card"
import { RfpSelector } from "./rfp-selector"
import { HomepageHeader } from "./dashboard-header"
import { Skeleton } from "../ui/skeleton"

type Attachment = {
  id: number;
  name: string;
  size: string;
  type: string;
  url: string;
};

type HomepageClientProps = {
  searchParams: { [key: string]: string | string[] | undefined };
}

function DashboardSkeleton() {
    return (
        <>
            <HomepageHeader />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-6">
                    <Skeleton className="h-12 w-full md:w-1/3 mb-6" />
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3">
                            <Card>
                                <CardHeader><Skeleton className="h-6 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
                                <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                            <Card>
                                 <CardHeader><Skeleton className="h-6 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
                                 <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                            <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}

export function HomepageClient({ searchParams }: HomepageClientProps) {
  const { tenant } = useTenant();
  const router = useRouter();
  const pathname = usePathname();
  
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [selectedRfp, setSelectedRfp] = useState<RFP | undefined>();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [rfpAttachments, setRfpAttachments] = useState<Record<string, Attachment[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);
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
    // This effect handles selection changes after the initial load or URL changes
    const rfpIdFromUrl = typeof searchParams.rfpId === 'string' ? searchParams.rfpId : undefined;
    if (rfps.length > 0) {
        const rfpToSelect = rfps.find(r => r.id === rfpIdFromUrl) || rfps[0];
        setSelectedRfp(rfpToSelect);
        setQuestions(rfpToSelect?.questions || []);
    } else {
        setSelectedRfp(undefined);
        setQuestions([]);
    }
  }, [searchParams.rfpId, rfps]);

  useEffect(() => {
    return () => {
      Object.values(rfpAttachments).flat().forEach(att => URL.revokeObjectURL(att.url));
    }
  }, [rfpAttachments]);

  const handleUpdateQuestion = async (questionId: number, updates: Partial<Question>) => {
    if (!selectedRfp) return;
    
    const originalQuestions = questions;
    const newQuestions = questions.map(q => q.id === questionId ? { ...q, ...updates } : q)
    setQuestions(newQuestions);
    setRfps(prevRfps => prevRfps.map(r => r.id === selectedRfp.id ? {...r, questions: newQuestions} : r));

    const result = await updateQuestionAction(tenant.id, selectedRfp.id, questionId, updates, currentUser);
    if (result.error) {
        toast({ variant: "destructive", title: "Update Failed", description: result.error });
        setQuestions(originalQuestions);
        setRfps(prevRfps => prevRfps.map(r => r.id === selectedRfp.id ? {...r, questions: originalQuestions} : r));
    }
  }

  const handleAddQuestion = async (questionData: Omit<Question, 'id'>) => {
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
  };

  const handleProcessRfp = async (rfpText: string, file?: File) => {
    if (!rfpText.trim()) {
      toast({ variant: "destructive", title: "Input required" });
      return;
    }
    setIsProcessing(true);
    const rfpName = file ? file.name : `Pasted RFP - ${new Date().toLocaleDateString()}`;
    const result = await extractQuestionsAction(rfpText, rfpName, tenant.id, currentUser);

    if (result.error || !result.rfp) {
      toast({ variant: "destructive", title: "Extraction Error", description: result.error || "Could not process RFP" });
    } else {
      const newRfp = result.rfp;
      setRfps(prev => [newRfp, ...prev]);
      
      if (file) {
        const newAttachment: Attachment = {
          id: Date.now(),
          name: file.name,
          size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`,
          type: file.type,
          url: URL.createObjectURL(file),
        };
        setRfpAttachments(prev => ({ ...prev, [newRfp.id]: [newAttachment] }));
      }
      
      toast({ title: "RFP Processed", description: `Created new RFP: ${newRfp.name}` });
      router.push(`${pathname}?rfpId=${newRfp.id}`);
    }
    setIsProcessing(false);
  }

  const handleUpdateAttachments = (updatedAttachments: Attachment[]) => {
    if (!selectedRfp) return;
    const currentAttachments = rfpAttachments[selectedRfp.id] || [];
    currentAttachments.forEach(att => {
        if (!updatedAttachments.some(updatedAtt => updatedAtt.id === att.id)) {
            URL.revokeObjectURL(att.url);
        }
    });
    setRfpAttachments(prev => ({ ...prev, [selectedRfp.id]: updatedAttachments }));
  };

  if (isDataLoading) {
    return <DashboardSkeleton />;
  }
  
  const attachments = selectedRfp ? (rfpAttachments[selectedRfp.id] || []) : [];

  return (
    <>
      <HomepageHeader rfpName={selectedRfp?.name} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {rfps.length > 0 && selectedRfp ? (
            <RfpSelector rfps={rfps} selectedRfpId={selectedRfp.id} />
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <RfpSummaryCard
                isLoading={isProcessing}
                onProcessRfp={handleProcessRfp}
              />
            </div>

            {selectedRfp ? (
              <>
                <div className="lg:col-span-2">
                  <QAndAList 
                    questions={questions} 
                    tenantId={tenant.id}
                    rfpId={selectedRfp.id}
                    members={tenant.members} 
                    onUpdateQuestion={handleUpdateQuestion}
                    onAddQuestion={handleAddQuestion}
                  />
                </div>
                <div className="lg:col-span-1 space-y-6">
                  <AttachmentsCard 
                      attachments={attachments}
                      onUpdateAttachments={handleUpdateAttachments}
                  />
                  <ComplianceCard />
                </div>
              </>
            ) : (
              <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>No RFPs Found</CardTitle>
                        <CardDescription>
                            Get started by processing your first RFP using the card above.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg min-h-[200px]">
                          <FileText className="size-12 text-muted-foreground" />
                          <h3 className="font-semibold">Your Questions Will Appear Here</h3>
                          <p className="text-sm text-muted-foreground max-w-md">Once you process an RFP, we'll use AI to extract and list all the questions for you to answer.</p>
                        </div>
                    </CardContent>
                  </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
