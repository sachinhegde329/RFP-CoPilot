
import type { Tenant, Role } from "./tenants";
import type { addOnsConfig } from "./tenants";

// Features controlled by plans and add-ons
export type Feature = keyof typeof addOnsConfig | 'aiExpertReview';

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
    growth: ['aiExpertReview', 'analytics', 'customTemplates'],
    enterprise: ['aiExpertReview', 'analytics', 'customTemplates', 'complianceValidation'],
};

// Permission matrix based on the provided image, mapping roles as discussed
// The matrix has Viewer, Contributor, Editor, Reviewer, Admin.
// We map these to our roles: Viewer, Editor, Approver, Admin, Owner.
const rolePermissions: Record<Role, Action[]> = {
    // Owner is a super-admin, has all permissions
    Owner: ['viewContent', 'editContent', 'assignQuestions', 'uploadRfps', 'finalizeExport', 'manageTeam', 'editWorkspace', 'manageIntegrations', 'manageSecurity'],
    // Admin has all permissions as per the matrix
    Admin: ['viewContent', 'editContent', 'assignQuestions', 'uploadRfps', 'finalizeExport', 'manageTeam', 'editWorkspace', 'manageIntegrations', 'manageSecurity'],
    // Approver maps to Reviewer: can view and finalize
    Approver: ['viewContent', 'finalizeExport'],
    // Editor maps to a combination of Contributor and Editor from the matrix
    Editor: ['viewContent', 'editContent', 'assignQuestions', 'uploadRfps', 'finalizeExport'],
    // Viewer can only view
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
