"use client"

import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  History,
  Loader2,
  Bot,
  Clipboard,
  ClipboardCheck,
  Tag,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateAnswerAction, reviewAnswerAction } from "@/app/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type QAndAItemProps = {
  question: string
  id: number
  category: string
  compliance: "passed" | "failed" | "pending"
}

export function QAndAItem({ question, id, category, compliance }: QAndAItemProps) {
  const [answer, setAnswer] = useState("")
  const [review, setReview] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  const handleGenerateAnswer = async () => {
    setIsGenerating(true)
    setReview("")
    // In a real app, context would come from a knowledge base
    const context = "RFP CoPilot is an AI-powered platform to streamline RFP responses. It uses generative AI for summarization, answer drafting, and expert review. It supports various compliance standards and offers customizable templates."
    const result = await generateAnswerAction(question, context)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    } else {
      setAnswer(result.answer || "")
    }
    setIsGenerating(false)
  }

  const handleReviewAnswer = async () => {
    if (!answer) {
      toast({
        variant: "destructive",
        title: "Cannot Review",
        description: "Please provide an answer before requesting a review.",
      })
      return
    }
    setIsReviewing(true)
    const result = await reviewAnswerAction(question, answer)
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    } else {
      setReview(result.review || "")
    }
    setIsReviewing(false)
  }
  
  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  const ComplianceBadge = () => {
    switch (compliance) {
      case "passed":
        return (
          <Badge variant="secondary" className="text-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Passed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <ShieldCheck className="mr-1 h-3 w-3" /> Pending
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-base font-medium flex-1">
            {`Q${id}: ${question}`}
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="hidden sm:flex items-center">
              <Tag className="mr-1 h-3 w-3" />
              {category}
            </Badge>
            <ComplianceBadge />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder="Draft your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="pr-10"
            rows={5}
          />
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
            {isCopied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            <span className="sr-only">Copy</span>
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerateAnswer} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              Generate Answer
            </Button>
            <Button
              variant="outline"
              onClick={handleReviewAnswer}
              disabled={isReviewing || !answer}
            >
              {isReviewing ? <Loader2 className="animate-spin" /> : <Bot />}
              AI Expert Review
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <History className="text-muted-foreground" />
            <Select defaultValue="v3">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v3">Version 3</SelectItem>
                <SelectItem value="v2">Version 2</SelectItem>
                <SelectItem value="v1">Version 1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {review && (
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>AI Expert Review</AlertTitle>
            <AlertDescription className="prose prose-sm max-w-none">
              {review}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
