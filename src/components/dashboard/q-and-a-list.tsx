'use client'

import { useState, useMemo, useEffect } from "react"
import { QAndAItem } from "./q-and-a-item"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { TeamMember } from "@/lib/tenants"
import { useTenant } from "@/components/providers/tenant-provider"
import { PlusCircle, ChevronDown } from "lucide-react"
import { Accordion } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


type Question = {
  id: number
  question: string
  category: string
  answer: string
  compliance: "passed" | "failed" | "pending"
  assignee?: TeamMember | null
  status: 'Unassigned' | 'In Progress' | 'Completed'
}

type QAndAListProps = {
  initialQuestions: Question[]
  tenantId: string
  members: TeamMember[]
  isLocked: boolean
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => void;
}

type FilterType = "all" | "assignedToMe" | "unassigned" | "inProgress" | "completed"

export function QAndAList({ initialQuestions, tenantId, members, isLocked, onUpdateQuestion }: QAndAListProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [activeFilter, setActiveFilter] = useState<FilterType>("assignedToMe")
  const { tenant } = useTenant(); 
  const currentUser = tenant.members[0]; // For demo, assume current user is the first member

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const filteredQuestions = useMemo(() => {
    switch (activeFilter) {
      case "assignedToMe":
        return questions.filter(q => q.assignee?.id === currentUser.id)
      case "unassigned":
        return questions.filter(q => !q.assignee)
      case "inProgress":
        return questions.filter(q => q.status === 'In Progress')
      case "completed":
        return questions.filter(q => q.status === 'Completed')
      case "all":
      default:
        return questions
    }
  }, [questions, activeFilter, currentUser.id])
  
  // Progress calculation
  const completedCount = useMemo(() => questions.filter(q => q.status === 'Completed').length, [questions]);
  const totalCount = questions.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const isAssignmentFilterActive = activeFilter === 'assignedToMe' || activeFilter === 'unassigned';
  
  const assignmentFilterLabel = useMemo(() => {
    if (activeFilter === 'assignedToMe') return 'Assigned to Me';
    if (activeFilter === 'unassigned') return 'Unassigned';
    return 'Filter by Assignee';
  }, [activeFilter]);

  const isStatusFilterActive = activeFilter === 'inProgress' || activeFilter === 'completed';
  
  const statusFilterLabel = useMemo(() => {
    if (activeFilter === 'inProgress') return 'In Progress';
    if (activeFilter === 'completed') return 'Completed';
    return 'Filter by Status';
  }, [activeFilter]);


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Extracted Questions</CardTitle>
            <CardDescription>
              Filter, assign, and answer the questions extracted from the RFP.
            </CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2" />
            Add Question
          </Button>
        </div>

        {totalCount > 0 && (
          <div className="pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Overall Progress</span>
                  <span>{completedCount} of {totalCount} Completed</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4">
            <Button variant={activeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('all')}>All ({questions.length})</Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isAssignmentFilterActive ? 'default' : 'outline'} size="sm" className="flex items-center">
                  {assignmentFilterLabel}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)}>
                    <DropdownMenuRadioItem value="assignedToMe">Assigned to Me ({questions.filter(q => q.assignee?.id === currentUser.id).length})</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="unassigned">Unassigned ({questions.filter(q => !q.assignee).length})</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isStatusFilterActive ? 'default' : 'outline'} size="sm" className="flex items-center">
                  {statusFilterLabel}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)}>
                    <DropdownMenuRadioItem value="inProgress">In Progress ({questions.filter(q => q.status === 'In Progress').length})</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="completed">Completed ({questions.filter(q => q.status === 'Completed').length})</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="multiple" className="w-full border-b">
            {filteredQuestions.map((q) => (
            <QAndAItem
                key={q.id}
                questionData={q}
                tenantId={tenantId}
                members={members}
                onUpdateQuestion={onUpdateQuestion}
                isLocked={isLocked}
            />
            ))}
        </Accordion>
         {filteredQuestions.length === 0 && (
            <div className="text-center text-muted-foreground p-8 border-t">
                No questions match the current filter.
            </div>
        )}
      </CardContent>
    </Card>
  )
}
