import { QAndAItem } from "./q-and-a-item"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

type Question = {
  id: number
  question: string
  category: string
  compliance: "passed" | "failed" | "pending"
}

type QAndAListProps = {
  questions: Question[]
  tenantId: string
}

export function QAndAList({ questions, tenantId }: QAndAListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Questions</CardTitle>
        <CardDescription>
          Review, edit, and generate answers for the questions extracted from the RFP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q) => (
          <QAndAItem
            key={q.id}
            id={q.id}
            question={q.question}
            category={q.category}
            compliance={q.compliance}
            tenantId={tenantId}
          />
        ))}
      </CardContent>
    </Card>
  )
}
