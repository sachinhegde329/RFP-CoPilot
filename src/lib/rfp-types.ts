import type { TeamMember } from './tenant-types';

export type QuestionStatus = 'Unassigned' | 'In Progress' | 'Completed';
export type ComplianceStatus = 'passed' | 'failed' | 'pending';
export type RfpStatus = 'Draft' | 'In Progress' | 'Submitted' | 'Won' | 'Lost';

export interface Question {
  id: number;
  question: string;
  category: string;
  answer: string;
  compliance: ComplianceStatus;
  assignee?: TeamMember | null;
  status: QuestionStatus;
  tags?: string[];
}

export interface RFP {
    id: string;
    tenantId: string;
    name: string;
    status: RfpStatus;
    questions: Question[];
    topics?: string[];
}
