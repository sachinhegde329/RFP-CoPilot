import type { TeamMember } from './tenant-types';

export type QuestionStatus = 'Unassigned' | 'In Progress' | 'Completed';
export type ComplianceStatus = 'passed' | 'failed' | 'pending';
export type RfpStatus = 'Open' | 'Completed' | 'Draft';

export interface Question {
  id: number;
  question: string;
  category: string;
  answer: string;
  compliance: ComplianceStatus;
  assignee?: TeamMember | null;
  status: QuestionStatus;
}

export interface RFP {
    id: string;
    name: string;
    status: RfpStatus;
    questions: Question[];
    topics?: string[];
}
