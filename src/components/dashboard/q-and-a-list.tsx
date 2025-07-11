
'use client'

import { useState, useMemo } from "react"
import { QAndAItem } from "./question-table-row"
import { Button } from "@/components/ui/button"
import type { TeamMember } from "@/lib/tenant-types"
import { Settings, X, Search, Filter } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import type { Question, QuestionStatus } from "@/lib/rfp-types"
import { Input } from "../ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { FixedSizeList as List } from 'react-window';

type QAndAListProps = {
  questions: Question[]
  tenantId: string
  rfpId: string
  members: TeamMember[]
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => void;
  onAddQuestion: (questionData: Omit<Question, 'id'>) => Promise<boolean>;
  onOpenAutogenSettings: () => void;
}

export function QAndAList({ questions, tenantId, rfpId, members, onUpdateQuestion, onAddQuestion, onOpenAutogenSettings }: QAndAListProps) {
  const { tenant } = useTenant(); 
  const currentUser = tenant.members[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<QuestionStatus[]>([]);
  const [filterAssignees, setFilterAssignees] = useState<string[]>([]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const questionMatch = q.question.toLowerCase().includes(lowerCaseSearchTerm);
      const answerMatch = q.answer.toLowerCase().includes(lowerCaseSearchTerm);
      const tagsMatch = q.tags?.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm)) || false;

      const searchTermMatch = searchTerm === '' || questionMatch || answerMatch || tagsMatch;
      
      const statusMatch = filterStatuses.length === 0 || filterStatuses.includes(q.status);
      
      let assigneeMatch = true;
      if (filterAssignees.length > 0) {
        if (q.assignee) {
          assigneeMatch = filterAssignees.includes(q.assignee.id.toString());
        } else {
          assigneeMatch = filterAssignees.includes('unassigned');
        }
      }

      return searchTermMatch && statusMatch && assigneeMatch;
    });
  }, [questions, searchTerm, filterStatuses, filterAssignees]);

  const groupedQuestions = useMemo(() => {
    return filteredQuestions.reduce((acc, q) => {
      const category = q.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(q);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [filteredQuestions]);
  
  const categoryKeys = Object.keys(groupedQuestions);
  
  const handleStatusFilterChange = (status: QuestionStatus, checked: boolean | string) => {
    setFilterStatuses(prev => 
      checked ? [...prev, status] : prev.filter(s => s !== status)
    );
  };

  const handleAssigneeFilterChange = (assigneeId: string, checked: boolean | string) => {
    setFilterAssignees(prev => 
      checked ? [...prev, assigneeId] : prev.filter(id => id !== assigneeId)
    );
  };

  const clearFilters = () => {
    setFilterStatuses([]);
    setFilterAssignees([]);
  };
  
  const activeFilterCount = filterStatuses.length + filterAssignees.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 focus-within:z-10">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search questions..." 
            className="w-full rounded-lg bg-background pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                <Badge variant="secondary" className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                    {activeFilterCount}
                </Badge>
                )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters} disabled={activeFilterCount === 0}>
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            </div>
            <Separator className="my-2" />
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Status</p>
                {(['Unassigned', 'In Progress', 'Completed'] as QuestionStatus[]).map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filterStatuses.includes(status)}
                      onCheckedChange={(checked) => handleStatusFilterChange(status, checked)}
                    />
                    <Label htmlFor={`status-${status}`} className="text-sm font-normal">{status}</Label>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                 <p className="text-xs font-semibold text-muted-foreground">Assignee</p>
                 <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assignee-unassigned"
                      checked={filterAssignees.includes('unassigned')}
                      onCheckedChange={(checked) => handleAssigneeFilterChange('unassigned', checked)}
                    />
                    <Label htmlFor="assignee-unassigned" className="text-sm font-normal">Unassigned</Label>
                  </div>
                {members.map(member => (
                   <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`assignee-${member.id}`}
                      checked={filterAssignees.includes(member.id.toString())}
                      onCheckedChange={(checked) => handleAssigneeFilterChange(member.id.toString(), checked)}
                    />
                    <Label htmlFor={`assignee-${member.id}`} className="text-sm font-normal">{member.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" onClick={onOpenAutogenSettings}><Settings /></Button>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 text-sm font-medium text-muted-foreground">
        <div className="col-span-8 flex items-center gap-3 md:col-span-6"><Checkbox disabled/> Question</div>
        <div className="hidden md:block col-span-2">Assignee</div>
        <div className="hidden md:block col-span-2">Tags</div>
        <div className="col-span-4 text-right md:text-left md:col-span-2">Status</div>
      </div>
      
      {/* Question List */}
      <div className="pr-2">
        {filteredQuestions.length > 0 ? (
          <Accordion type="multiple" defaultValue={categoryKeys} className="w-full space-y-4">
            {categoryKeys.map((category, index) => (
              <AccordionItem
                key={category}
                value={category}
                className="bg-card rounded-lg border animate-fade-in-slide-up"
                style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
              >
                <AccordionTrigger className="p-4 text-base font-semibold hover:no-underline">
                  {category} ({groupedQuestions[category].length})
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="flex flex-col">
                    {/* Virtualized question list for this category */}
                    <List
                      height={Math.min(400, groupedQuestions[category].length * 72)}
                      itemCount={groupedQuestions[category].length}
                      itemSize={72}
                      width="100%"
                    >
                      {({ index, style }: { index: number; style: React.CSSProperties }) => {
                        const q = groupedQuestions[category][index];
                        return (
                          <div style={style} key={q.id}>
                            <QAndAItem
                              questionData={q}
                              tenantId={tenantId}
                              rfpId={rfpId}
                              members={members}
                              onUpdateQuestion={onUpdateQuestion}
                            />
                          </div>
                        );
                      }}
                    </List>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex items-center justify-center py-10 text-center text-muted-foreground">
            <div>
              <p className="font-semibold">No questions match your filters.</p>
              <p className="text-sm">Try adjusting your search or clearing the filters.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
