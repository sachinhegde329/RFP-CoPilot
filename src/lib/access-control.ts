import type { Tenant } from "./tenants";
import type { addOnsConfig } from "./tenants";

export type Feature = keyof typeof addOnsConfig | 'aiExpertReview';

const planFeatureMatrix: Record<Tenant['plan'], Feature[]> = {
    free: [],
    starter: ['aiExpertReview'],
    growth: ['aiExpertReview', 'analytics', 'customTemplates'],
    enterprise: ['aiExpertReview', 'analytics', 'customTemplates', 'complianceValidation'],
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
