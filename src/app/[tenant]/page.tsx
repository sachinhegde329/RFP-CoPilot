
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
      category: "Security",
      compliance: "pending",
      assignee: tenant.members.find(m => m.role === 'Admin') || null, // Assign to first Admin
      status: 'In Progress'
    },
    {
      id: 2,
      question: "Can you describe your Service Level Agreement (SLA) for production uptime and provide details on support tiers?",
      category: "Legal",
      compliance: "pending",
      assignee: tenant.members.find(m => m.role === 'Owner') || null, // Assign to Owner (current user)
      status: 'In Progress'
    },
    {
      id: 3,
      question: "Please outline your pricing structure, including any volume discounts or multi-year contract options.",
      category: "Pricing",
      compliance: "pending",
      assignee: null,
      status: 'Unassigned'
    },
    {
      id: 4,
      question: "How does your solution integrate with third-party CRM platforms like Salesforce?",
      category: "Product",
      compliance: "pending",
      assignee: tenant.members.find(m => m.role === 'Editor') || null,
      status: 'Completed'
    }
  ], [tenant.members]);
  
  const [summary, setSummary] = useState(sampleSummary)
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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
            <TemplateCard />
          </div>
        </div>
      </main>
    </SidebarInset>
  )
}
