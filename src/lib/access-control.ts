
import type { Tenant, Role } from "./tenants";
import type { addOnsConfig } from "./tenants";

// Features controlled by plans and add-ons
export type Feature = keyof typeof addOnsConfig | 'aiExpertReview' | 'complianceValidation' | 'sso';

// Granular actions based on user roles, mapped from the provided matrix
export type Action =
  | 'viewContent'
  | 'editContent'
  | 'assignQuestions'
  | 'uploadRfps'
  | 'finalizeExport'
  | 'manageTeam'
  | 'editWorkspace'
  | 'manageIntegrations'
  | 'manageSecurity';


const planFeatureMatrix: Record<Tenant['plan'], Feature[]> = {
    free: [],
    starter: ['aiExpertReview'],
    team: ['aiExpertReview'], // Team plan from pricing page
    business: ['aiExpertReview', 'analytics'], // Business plan from pricing page
    enterprise: ['aiExpertReview', 'analytics', 'customTemplates', 'complianceValidation', 'sso'],
};

/**
 * Permission matrix based on the provided user persona matrix.
 * This maps our application roles (Owner, Admin, Approver, Editor, Viewer)
 * to the granular actions a user can perform.
 *
 * The mapping from the user-provided personas to our roles is as follows:
 * - Owner: Super-admin with all permissions.
 * - Admin: Maps to "Team Admin" and "IT Admin".
 * - Approver: Maps to "Reviewer/Legal" and "Security/Compliance".
 * - Editor: Maps to "Sales Executive", "Pre-sales/SA", and "Product Manager".
 * - Viewer: A read-only role.
 */
const rolePermissions: Record<Role, Action[]> = {
    // Owner is a super-admin, has all permissions.
    Owner: ['viewContent', 'editContent', 'assignQuestions', 'uploadRfps', 'finalizeExport', 'manageTeam', 'editWorkspace', 'manageIntegrations', 'manageSecurity'],
    
    // Admin (Team Admin, IT Admin) has broad permissions across the application.
    Admin: ['viewContent', 'editContent', 'assignQuestions', 'uploadRfps', 'finalizeExport', 'manageTeam', 'editWorkspace', 'manageIntegrations', 'manageSecurity'],
    
    // Approver (Reviewer/Legal, Security/Compliance) can view, comment, and make final approvals.
    Approver: ['viewContent', 'editContent', 'finalizeExport'],
    
    // Editor (Sales Exec, Pre-Sales, Product Manager) handles the primary RFP and knowledge base work.
    Editor: ['viewContent', 'editContent', 'assignQuestions', 'uploadRfps', 'manageIntegrations'],
    
    // Viewer has read-only access to content.
    Viewer: ['viewContent'],
};


/**
 * Checks if a tenant has access to a specific feature based on their plan and add-ons.
 * @param tenant The tenant object.
 * @param feature The feature to check access for.
 * @returns `true` if the tenant has access, otherwise `false`.
 */
export function hasFeatureAccess(tenant: Tenant, feature: Feature): boolean {
    // Check if the feature is included in the base plan
    if (planFeatureMatrix[tenant.plan].includes(feature)) {
        return true;
    }

    // Check if the feature has been purchased as an add-on
    if (tenant.addOns?.includes(feature)) {
        return true;
    }

    return false;
}

/**
 * Checks if a user with a given role can perform a specific action.
 * @param role The user's role.
 * @param action The action to check.
 * @returns `true` if the role has permission, otherwise `false`.
 */
export function canPerformAction(role: Role, action: Action): boolean {
    return rolePermissions[role]?.includes(action) || false;
}
