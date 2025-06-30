'use client'

import { useState, useMemo } from "react"
import { QAndAItem } from "./q-and-a-item"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { TeamMember } from "@/lib/tenants"
import { useTenant } from "@/components/providers/tenant-provider"

type Question = {
  id: number
  question: string
  category: string
  compliance: "passed" | "failed" | "pending"
  assignee?: TeamMember | null
  status: 'Unassigned' | 'In Progress' | 'Completed'
}

type QAndAListProps = {
  initialQuestions: Question[]
  tenantId: string
  members: TeamMember[]
}

type FilterType = "all" | "assignedToMe" | "unassigned" | "completed"

export function QAndAList({ initialQuestions, tenantId, members }: QAndAListProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const { tenant } = useTenant(); 
  const currentUser = tenant.members[0]; // For demo, assume current user is the first member

  const handleUpdateQuestion = (questionId: number, updates: Partial<Question>) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    )
  }

  const filteredQuestions = useMemo(() => {
    switch (activeFilter) {
      case "assignedToMe":
        return questions.filter(q => q.assignee?.id === currentUser.id)
      case "unassigned":
        return questions.filter(q => !q.assignee)
      case "completed":
        return questions.filter(q => q.status === 'Completed')
      case "all":
      default:
        return questions
    }
  }, [questions, activeFilter, currentUser.id])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Questions</CardTitle>
        <CardDescription>
          Filter, assign, and answer the questions extracted from the RFP.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
            <Button variant={activeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('all')}>All</Button>
            <Button variant={activeFilter === 'assignedToMe' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('assignedToMe')}>Assigned to Me</Button>
            <Button variant={activeFilter === 'unassigned' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('unassigned')}>Unassigned</Button>
            <Button variant={activeFilter === 'completed' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('completed')}>Completed</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredQuestions.map((q) => (
          <QAndAItem
            key={q.id}
            questionData={q}
            tenantId={tenantId}
            members={members}
            onUpdateQuestion={handleUpdateQuestion}
          />
        ))}
         {filteredQuestions.length === 0 && (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                No questions match the current filter.
            </div>
        )}
      </CardContent>
    </Card>
  )
}
