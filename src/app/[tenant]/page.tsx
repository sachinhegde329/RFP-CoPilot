
'use client'

import { useState, useMemo } from "react"
import { useTenant } from "@/components/providers/tenant-provider"
import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { RfpSummaryCard } from "@/components/dashboard/rfp-summary-card"
import { QAndAList } from "@/components/dashboard/q-and-a-list"
import { ComplianceCard } from "@/components/dashboard/compliance-card"
import { TemplateCard } from "@/components/dashboard/template-card"
import { summarizeRfpAction, extractQuestionsAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Bot } from "lucide-react"
import type { TeamMember } from "@/lib/tenants"

type Question = {
  id: number
  question: string
  category: string
  answer: string
  compliance: "passed" | "failed" | "pending"
  assignee?: TeamMember | null
  status: 'Unassigned' | 'In Progress' | 'Completed'
}

// Sample data for summary
const sampleSummary = "This is a sample RFP for a comprehensive enterprise software solution. Key areas of focus include data security, service level agreements (SLAs), pricing models, and integration capabilities with existing platforms like Salesforce. The proposal is due by the end of the month."

export default function DashboardPage() {
  const { tenant } = useTenant();

  // Sample data for questions, using tenant members for assignment
  const sampleQuestions = useMemo((): Question[] => [
    {
      id: 1,
      question: "What is your data retention policy, and how do you ensure customer data is securely deleted upon request?",
      answer: "Our data retention policy adheres to industry best practices, retaining customer data for the duration of the contract plus an additional 90 days for recovery purposes. Upon a verified request, data is securely deleted from all active and backup systems using a 3-pass overwrite method to ensure it is irrecoverable.",
      category: "Security",
      compliance: "pending",
      assignee: tenant.members.find(m => m.role === 'Admin') || null, // Assign to first Admin
      status: 'In Progress'
    },
    {
      id: 2,
      question: "Can you describe your Service Level Agreement (SLA) for production uptime and provide details on support tiers?",
      answer: "Our standard SLA guarantees 99.9% uptime for our production environment, excluding scheduled maintenance. We offer two support tiers: Standard (9-5 business hours, email support) and Premium (24/7 phone and email support with a 1-hour response time guarantee for critical issues).",
      category: "Legal",
      compliance: "pending",
      assignee: tenant.members.find(m => m.role === 'Owner') || null, // Assign to Owner (current user)
      status: 'In Progress'
    },
    {
      id: 3,
      question: "Please outline your pricing structure, including any volume discounts or multi-year contract options.",
      answer: "",
      category: "Pricing",
      compliance: "pending",
      assignee: null,
      status: 'Unassigned'
    },
    {
      id: 4,
      question: "How does your solution integrate with third-party CRM platforms like Salesforce?",
      answer: "Our solution provides a native, bi-directional integration with Salesforce via a managed package available on the AppExchange. This integration syncs custom objects, standard objects, and allows for seamless data flow between the two platforms without the need for middleware.",
      category: "Product",
      compliance: "pending",
      assignee: tenant.members.find(m => m.role === 'Editor') || null,
      status: 'Completed'
    }
  ], [tenant.members]);
  
  const [summary, setSummary] = useState(sampleSummary)
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions)
  const [isLoading, setIsLoading] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const { toast } = useToast()

  const handleUpdateQuestion = (questionId: number, updates: Partial<Question>) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    )
  }

  const handleProcessRfp = async (rfpText: string) => {
    if (!rfpText.trim()) {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please paste your RFP content to generate a summary and extract questions.",
      })
      return
    }
    setIsLoading(true)
    setSummary("")
    setQuestions([])
    setIsLocked(false) // Unlock when new RFP is processed

    try {
      // Run actions in parallel
      const [summaryResult, questionsResult] = await Promise.all([
        summarizeRfpAction(rfpText),
        extractQuestionsAction(rfpText),
      ])

      if (summaryResult.error) {
        toast({
          variant: "destructive",
          title: "Summarization Error",
          description: summaryResult.error,
        })
      } else {
        setSummary(summaryResult.summary || "")
      }

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

  return (
    <SidebarInset className="flex-1">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <RfpSummaryCard
              summary={summary}
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
                initialQuestions={questions} 
                tenantId={tenant.id} 
                members={tenant.members} 
                isLocked={isLocked}
                onUpdateQuestion={handleUpdateQuestion}
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
            <ComplianceCard />
            <TemplateCard 
              questions={questions}
              isLocked={isLocked}
              onLockChange={setIsLocked}
            />
          </div>
        </div>
      </main>
    </SidebarInset>
  )
}
