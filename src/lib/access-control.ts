
import type { Tenant, Role } from "./tenants";
import type { addOnsConfig } from "./tenants";

export type Feature = keyof typeof addOnsConfig | 'aiExpertReview';
export type Action = 'manageTeam' | 'editWorkspace' | 'approveContent' | 'editContent' | 'viewContent';


const planFeatureMatrix: Record<Tenant['plan'], Feature[]> = {
    free: [],
    starter: ['aiExpertReview'],
    growth: ['aiExpertReview', 'analytics', 'customTemplates'],
    enterprise: ['aiExpertReview', 'analytics', 'customTemplates', 'complianceValidation'],
};

const rolePermissions: Record<Role, Action[]> = {
    Owner: ['manageTeam', 'editWorkspace', 'approveContent', 'editContent', 'viewContent'],
    Admin: ['manageTeam', 'editWorkspace', 'approveContent', 'editContent', 'viewContent'],
    Approver: ['approveContent', 'editContent', 'viewContent'],
    Editor: ['editContent', 'viewContent'],
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
