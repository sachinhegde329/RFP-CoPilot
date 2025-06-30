
"use client"

import { useState, useRef, type ChangeEvent } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UploadCloud, Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { parseDocumentAction } from "@/app/actions"
import { useTenant } from "@/components/providers/tenant-provider"
import { canPerformAction } from "@/lib/access-control"

type RfpSummaryCardProps = {
  isLoading: boolean;
  onProcessRfp: (rfpText: string, file?: File) => void;
};

export function RfpSummaryCard({ isLoading, onProcessRfp }: RfpSummaryCardProps) {
  const [rfpText, setRfpText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { tenant } = useTenant()

  const currentUser = tenant.members[0];
  const canUpload = canPerformAction(currentUser.role, 'uploadRfps');

  const handleProcess = () => {
    onProcessRfp(rfpText);
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileSizeLimitBytes = tenant.limits.fileSizeMb * 1024 * 1024;
    if (file.size > fileSizeLimitBytes) {
      toast({
          variant: "destructive",
          title: "File Too Large",
          description: `Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB, which exceeds the ${tenant.limits.fileSizeMb}MB limit for the ${tenant.plan} plan.`,
      });
      if(fileInputRef.current) {
          fileInputRef.current.value = ""
      }
      return;
    }

    setIsUploading(true)

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await parseDocumentAction(dataUri, tenant.id, currentUser)

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
            onProcessRfp(result.text, file)
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
        <CardTitle>RFP Ingestion &amp; Question Extraction</CardTitle>
        <CardDescription>
          Upload or paste your RFP document. We'll use AI to find and list all the questions for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.docx,.xlsx,.md,.txt,.html"
            disabled={isLoading || isUploading || !canUpload}
        />
        <Textarea
          placeholder="Paste the content of your RFP here to get started..."
          className="min-h-[150px] text-sm"
          value={rfpText}
          onChange={(e) => setRfpText(e.target.value)}
          disabled={isLoading || isUploading || !canUpload}
        />
        <div className="flex gap-2">
          <Button onClick={handleProcess} disabled={isLoading || isUploading || !rfpText || !canUpload}>
            {isLoading && !isUploading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            Process RFP
          </Button>
          <Button variant="outline" disabled={isLoading || isUploading || !canUpload} onClick={handleUploadClick}>
            {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
