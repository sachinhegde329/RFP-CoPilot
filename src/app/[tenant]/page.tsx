'use client'

import { useState } from "react"
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

type Question = {
  id: number
  question: string
  category: string
  compliance: "passed" | "failed" | "pending"
}

export default function DashboardPage() {
  const [summary, setSummary] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { tenant } = useTenant();

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
              <QAndAList questions={questions} tenantId={tenant.id} />
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
