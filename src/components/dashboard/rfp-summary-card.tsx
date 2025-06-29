"use client"

import { useState, useRef, type ChangeEvent } from "react"
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
import { parseDocumentAction } from "@/app/actions"

type RfpSummaryCardProps = {
  summary: string;
  isLoading: boolean;
  onProcessRfp: (rfpText: string) => void;
};

export function RfpSummaryCard({ summary, isLoading, onProcessRfp }: RfpSummaryCardProps) {
  const [rfpText, setRfpText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleProcess = () => {
    onProcessRfp(rfpText);
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await parseDocumentAction(dataUri)

        if (result.error || !result.text) {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: result.error || "Could not extract text from document.",
            })
        } else {
            toast({
                title: "Upload Successful",
                description: `Successfully parsed ${file.name}.`,
            });
            setRfpText(result.text)
            onProcessRfp(result.text)
        }
        setIsUploading(false)
        if(fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    };
    reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Could not read the selected file.",
        })
        setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RFP Ingestion &amp; Auto-Summary</CardTitle>
        <CardDescription>
          Upload or paste your RFP document to get an AI-generated summary and question list.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.docx,.xlsx,.md,.txt,.html"
            disabled={isLoading || isUploading}
        />
        <Textarea
          placeholder="Paste the content of your RFP here to get started..."
          className="min-h-[150px] text-sm"
          value={rfpText}
          onChange={(e) => setRfpText(e.target.value)}
          disabled={isLoading || isUploading}
        />
        <div className="flex gap-2">
          <Button onClick={handleProcess} disabled={isLoading || isUploading || !rfpText}>
            {isLoading && !isUploading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            Process RFP
          </Button>
          <Button variant="outline" disabled={isLoading || isUploading} onClick={handleUploadClick}>
            {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            {isUploading ? 'Uploading...' : 'Upload Document'}
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
        <p className="text-sm text-muted-foreground -mt-2">Extracted by AI from the document.</p>
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
