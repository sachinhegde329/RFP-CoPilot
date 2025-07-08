
export type AddOn = 'analytics' | 'customTemplates' | 'complianceValidation' | 'aiAnswerPack';
// Role 'Approver' maps to 'Reviewer'. 'Editor' maps to 'Contributor'.
export type Role = 'Owner' | 'Admin' | 'Approver' | 'Editor' | 'Viewer';
export type MemberStatus = 'Active' | 'Pending';
export type BrandTone = 'Formal' | 'Consultative' | 'Technical';

// This is also used by access-control, so it lives here with other shared types/configs.
export type Feature = keyof typeof addOnsConfig | 'aiExpertReview' | 'complianceValidation' | 'sso' | 'analytics' | 'customTemplates';


export interface TeamMember {
  id: string; // Clerk User ID
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  status: MemberStatus;
}

export interface Tenant {
  id: string; // Subdomain
  name: string;
  subdomain: string;
  onboardingCompleted?: boolean;
  domains: string[];
  plan: 'free' | 'starter' | 'team' | 'business' | 'enterprise';
  ssoProvider?: 'microsoft' | 'okta' | 'google' | null;
  addOns?: AddOn[];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  defaultTone?: BrandTone;
  branding: {
    logoUrl: string;
    logoDataAiHint: string;
  };
  limits: {
    fileSizeMb: number;
    seats: number;
    rfps: number;
    aiAnswers: number;
  };
  members: TeamMember[];
}

export const addOnsConfig: Record<AddOn, { id: AddOn; name: string; description: string; price?: number }> = {
  analytics: { id: 'analytics', name: 'Advanced Analytics', description: 'Unlock detailed insights into your RFP process and win rates.', price: 49 },
  customTemplates: { id: 'customTemplates', name: 'Custom Export Templates', description: 'Create and manage branded templates for polished, professional responses.', price: 29 },
  complianceValidation: { id: 'complianceValidation', name: 'Compliance Validation', description: 'Automatically check answers against compliance standards like SOC 2 and ISO 27001.', price: 99 },
  aiAnswerPack: { id: 'aiAnswerPack', name: 'AI Answer Pack', description: 'Get an additional 100 AI-generated answers for your RFPs.', price: 9 }
};

export const plansConfig = {
  free: { seats: 1, fileSizeMb: 2, rfps: 1, aiAnswers: 10 },
  starter: { seats: 1, fileSizeMb: 5, rfps: 5, aiAnswers: 100 },
  team: { seats: 5, fileSizeMb: 10, rfps: 25, aiAnswers: 500 },
  business: { seats: 25, fileSizeMb: 25, rfps: Infinity, aiAnswers: 2500 },
  enterprise: { seats: 50, fileSizeMb: 50, rfps: Infinity, aiAnswers: Infinity },
};
