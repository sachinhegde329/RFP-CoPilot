"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, Sparkles, Loader2, CalendarClock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { summarizeRfpAction } from "@/app/actions"

export function RfpSummaryCard() {
  const [rfpText, setRfpText] = useState("")
  const [summary, setSummary] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSummarize = async () => {
    if (!rfpText.trim()) {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please paste your RFP content to generate a summary.",
      })
      return
    }
    setIsLoading(true)
    const result = await summarizeRfpAction(rfpText)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    } else {
      setSummary(result.summary || "")
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RFP Ingestion &amp; Auto-Summary</CardTitle>
        <CardDescription>
          Upload or paste your RFP document to get an AI-generated summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste the content of your RFP here to get started..."
          className="min-h-[150px] text-sm"
          value={rfpText}
          onChange={(e) => setRfpText(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={handleSummarize} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            Summarize
          </Button>
          <Button variant="outline">
            <UploadCloud />
            Upload Document
          </Button>
        </div>
        {summary && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>AI Summary</AlertTitle>
            <AlertDescription className="prose prose-sm max-w-none">
              {summary}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-col items-start gap-4 pt-6">
        <h3 className="font-semibold flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Key Deadlines &amp; Milestones</h3>
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">Submission Deadline</p>
                <p className="text-muted-foreground">July 31, 2024</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">Q&amp;A Period Ends</p>
                <p className="text-muted-foreground">July 15, 2024</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">Project Kick-off</p>
                <p className="text-muted-foreground">September 1, 2024</p>
            </div>
        </div>
      </CardFooter>
    </Card>
  )
}
