
"use client"

import { useState, useRef, type ChangeEvent, useTransition } from "react"
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
  onProcessRfp: (rfpText: string, file?: File) => Promise<{ error?: string } | void>;
};

export function RfpSummaryCard({ onProcessRfp }: RfpSummaryCardProps) {
  const [rfpText, setRfpText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const currentUser = tenant.members[0];
  const canUpload = canPerformAction(currentUser.role, 'uploadRfps');
  const isLoading = isUploading || isPending;

  const handleProcessRfp = (text: string, file?: File) => {
    if (!text) return;
    startTransition(async () => {
        const result = await onProcessRfp(text, file);
        if (result?.error) {
            toast({ variant: 'destructive', title: "Error Processing RFP", description: result.error });
        }
    });
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileSizeLimitBytes = tenant.limits.fileSizeMb * 1024 * 1024;
    if (file.size > fileSizeLimitBytes) {
      toast({
          variant: "destructive",
          title: "File Too Large",
          description: `Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB, which exceeds the ${tenant.limits.fileSizeMb}MB limit for your plan.`,
      });
      if(fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    toast({ title: "Parsing Document", description: `Please wait while we extract text from ${file.name}.`});

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await parseDocumentAction(dataUri, tenant.id, currentUser);
        setIsUploading(false);

        if (result.error || !result.text) {
            toast({ variant: "destructive", title: "Upload Failed", description: result.error || "Could not extract text from document." });
        } else {
            toast({ title: "Parsing Complete", description: "Document text has been extracted." });
            setRfpText(result.text); // Pre-fill textarea
            handleProcessRfp(result.text, file); // Automatically trigger processing
        }
        if(fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => {
        toast({ variant: "destructive", title: "Upload Failed", description: "Could not read the selected file." });
        setIsUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a New RFP</CardTitle>
        <CardDescription>
          Upload a new RFP document or paste its content below. We'll use AI to extract all the questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.docx,.xlsx,.md,.txt,.html"
            disabled={isLoading || !canUpload}
        />
        <Textarea
          placeholder="Paste the content of your RFP here to get started..."
          className="min-h-[150px] text-sm"
          value={rfpText}
          onChange={(e) => setRfpText(e.target.value)}
          disabled={isLoading || !canUpload}
        />
        <div className="flex gap-2">
          <Button onClick={() => handleProcessRfp(rfpText)} disabled={isLoading || !rfpText || !canUpload}>
            {isPending && !isUploading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Process RFP
          </Button>
          <Button variant="outline" disabled={isLoading || !canUpload} onClick={handleUploadClick}>
            {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            {isUploading ? 'Uploading...' : 'Upload RFP'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
