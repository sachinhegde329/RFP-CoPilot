'use client'

import { useState, useMemo } from "react"
import { QAndAItem } from "./question-table-row"
import { Button } from "@/components/ui/button"
import type { TeamMember } from "@/lib/tenant-types"
import { Settings } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import type { Question } from "@/lib/rfp-types"
import { Input } from "../ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "../ui/checkbox"

type QAndAListProps = {
  questions: Question[]
  tenantId: string
  rfpId: string
  members: TeamMember[]
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => void;
  onAddQuestion: (questionData: Omit<Question, 'id'>) => Promise<boolean>;
}

export function QAndAList({ questions, tenantId, rfpId, members, onUpdateQuestion, onAddQuestion }: QAndAListProps) {
  const { tenant } = useTenant(); 
  const currentUser = tenant.members[0];

  const groupedQuestions = useMemo(() => {
    return questions.reduce((acc, q) => {
      const category = q.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(q);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [questions]);
  
  const categoryKeys = Object.keys(groupedQuestions);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Input placeholder="Search questions..." className="bg-card"/>
        <Button variant="outline">Filters</Button>
        <Button variant="outline" size="icon" className="ml-auto"><Settings /></Button>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 text-sm font-medium text-muted-foreground">
        <div className="col-span-6 flex items-center gap-3"><Checkbox disabled/> Question</div>
        <div className="col-span-2">Assignee</div>
        <div className="col-span-2">Tags</div>
        <div className="col-span-2">Status</div>
      </div>
      
      {/* Question List */}
      <div className="flex-1 overflow-y-auto pr-2">
        <Accordion type="multiple" defaultValue={categoryKeys} className="w-full space-y-4">
          {categoryKeys.map((category) => (
            <AccordionItem key={category} value={category} className="bg-card rounded-lg border">
              <AccordionTrigger className="p-4 text-base font-semibold hover:no-underline">
                {category} ({groupedQuestions[category].length})
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="flex flex-col">
                  {groupedQuestions[category].map((q) => (
                    <QAndAItem
                      key={q.id}
                      questionData={q}
                      tenantId={tenantId}
                      rfpId={rfpId}
                      members={members}
                      onUpdateQuestion={onUpdateQuestion}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
