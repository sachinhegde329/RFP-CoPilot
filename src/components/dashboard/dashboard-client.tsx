'use client'

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTenant } from "@/components/providers/tenant-provider"
import { QAndAList } from "@/components/dashboard/q-and-a-list"
import { getRfpsAction, extractQuestionsAction, updateQuestionAction, addQuestionAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Question, RFP } from "@/lib/rfp-types"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { File, PlusCircle, Sparkles, Upload } from "lucide-react"
import { ExportRfpDialog } from "./export-rfp-dialog"

type Attachment = {
  id: number;
  name: string;
  size: string;
  type: string;
  url: string;
};

function RfpWorkspaceView() {
  const { tenant } = useTenant();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [selectedRfp, setSelectedRfp] = useState<RFP | undefined>();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [rfpAttachments, setRfpAttachments] = useState<Record<string, Attachment[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);
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
  
  useEffect(() => {
    return () => {
      Object.values(rfpAttachments).flat().forEach(att => URL.revokeObjectURL(att.url));
    }
  }, [rfpAttachments]);

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

  if (isDataLoading) {
    return <DashboardSkeleton />;
  }
  
  const progressPercentage = selectedRfp?.questions ? (selectedRfp.questions.filter(q => q.status === 'Completed').length / selectedRfp.questions.length) * 100 : 0;
  const attachments = selectedRfp ? (rfpAttachments[selectedRfp.id] || []) : [];

    return (
      <>
        <main className="flex-1 grid grid-cols-12 overflow-hidden">
          {/* Left Panel */}
          <div className="col-span-3 bg-card border-r border-border p-4 flex flex-col gap-6">
              <h2 className="text-lg font-semibold">{selectedRfp?.name || 'Select an RFP'}</h2>
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-2"/>
                <p className="text-xs text-muted-foreground">{Math.round(progressPercentage)}% complete</p>
              </div>

              <div className="flex flex-col gap-2">
                <Button><Sparkles className="mr-2"/> Autogenerate All</Button>
                <Button variant="outline" onClick={() => selectedRfp && setIsExportDialogOpen(true)} disabled={!selectedRfp}>Export</Button>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Files</h3>
                    <Button variant="ghost" size="sm"><PlusCircle className="mr-2"/> Files</Button>
                </div>
                 {attachments.length > 0 ? attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50">
                    <File className="h-4 w-4 text-muted-foreground"/>
                    <span className="truncate">{att.name}</span>
                  </div>
                 )) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                    No files attached.
                  </div>
                 )}
              </div>
          </div>
          
          {/* Right Panel */}
          <div className="col-span-9 flex flex-col overflow-y-auto p-6">
            {selectedRfp ? (
              <QAndAList 
                  questions={questions} 
                  tenantId={tenant.id}
                  rfpId={selectedRfp.id}
                  members={tenant.members} 
                  onUpdateQuestion={handleUpdateQuestion}
                  onAddQuestion={handleAddQuestion}
                />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <h3 className="text-2xl font-bold">Welcome to RFP CoPilot</h3>
                  <p className="text-muted-foreground">Select an RFP from the list or upload a new one to get started.</p>
                  <Button className="mt-4"><Upload className="mr-2"/> Upload New RFP</Button>
                </div>
              </div>
            )}
          </div>
        </main>
        {selectedRfp && <ExportRfpDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} rfp={selectedRfp} />}
      </>
    )
}

export function HomepageClient() {
  return <RfpWorkspaceView />;
}
