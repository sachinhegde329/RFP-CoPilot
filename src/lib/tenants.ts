
import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, arrayUnion, DocumentData } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export type AddOn = 'analytics' | 'customTemplates' | 'complianceValidation' | 'aiAnswerPack';
export type Role = 'Owner' | 'Admin' | 'Approver' | 'Editor' | 'Viewer';
export type MemberStatus = 'Active' | 'Pending';
export type BrandTone = 'Formal' | 'Consultative' | 'Technical';

export interface TeamMember {
  id: string; // Firebase User UID
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

const freeEmailProviders = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'live.com', 'msn.com']);

const tenantsCollection = collection(db, 'tenants');

function getLimitsForTenant(tenantData: Omit<Tenant, 'limits'>): Tenant['limits'] {
    return plansConfig[tenantData.plan];
}

function sanitizeData<T>(data: T): T {
    // A simple but effective way to convert Firestore-specific types (like Timestamps) to plain JSON
    return JSON.parse(JSON.stringify(data));
}


async function createFreeTenant(user: User, subdomain?: string): Promise<Tenant> {
  const emailDomain = user.email!.split('@')[1];
  const derivedSubdomain = subdomain || (freeEmailProviders.has(emailDomain) ? user.email!.split('@')[0] : emailDomain.split('.')[0]).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const name = `${user.displayName || 'My'}'s Workspace`;

  const newTenant: Omit<Tenant, 'limits'> = {
    id: derivedSubdomain,
    name,
    subdomain: derivedSubdomain,
    domains: freeEmailProviders.has(emailDomain) ? [] : [emailDomain],
    plan: 'starter',
    ssoProvider: null,
    addOns: [],
    defaultTone: 'Formal',
    branding: { logoUrl: 'https://placehold.co/128x32.png', logoDataAiHint: 'generic logo' },
    members: [{
      id: user.uid,
      name: user.displayName || 'User',
      email: user.email!,
      role: 'Owner',
      avatar: user.photoURL,
      status: 'Active'
    }]
  };
  
  const tenantWithLimits: Tenant = { ...newTenant, limits: getLimitsForTenant(newTenant) };
  
  await setDoc(doc(tenantsCollection, newTenant.id), tenantWithLimits);
  return tenantWithLimits;
}

export async function findOrCreateTenantForUser(user: User): Promise<Tenant | null> {
    if (!user.email) return null;

    const emailDomain = user.email.split('@')[1];

    // Find if a corporate tenant exists for the user's domain
    const q = query(tenantsCollection, where('domains', 'array-contains', emailDomain));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const tenantDoc = querySnapshot.docs[0];
        const tenant = { ...tenantDoc.data() as Omit<Tenant, 'limits'>, id: tenantDoc.id };
        const tenantWithLimits = { ...tenant, limits: getLimitsForTenant(tenant) };
        
        // Add user to existing tenant if not already a member
        if (!tenantWithLimits.members.some(m => m.id === user.uid)) {
            const newMember: TeamMember = {
                id: user.uid,
                name: user.displayName || 'User',
                email: user.email!,
                role: 'Editor',
                avatar: user.photoURL,
                status: 'Active'
            };
            await updateDoc(tenantDoc.ref, { members: arrayUnion(newMember) });
            tenantWithLimits.members.push(newMember);
        }
        return sanitizeData(tenantWithLimits);
    }

    // No corporate tenant found, create a new personal one
    return createFreeTenant(user);
}

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    const tenantDocRef = doc(db, 'tenants', subdomain);
    const tenantDoc = await getDoc(tenantDocRef);

    if (!tenantDoc.exists()) {
        // As a fallback, create a demo tenant if 'megacorp' is accessed but doesn't exist
        if (subdomain === 'megacorp') {
             const demoUser = { uid: 'demo-user-id', email: 'alex.j@megacorp.com', displayName: 'Alex Johnson', photoURL: 'https://placehold.co/100x100.png' } as User;
             const demoTenant = await createFreeTenant(demoUser, 'megacorp');
             const demoDocRef = doc(db, 'tenants', demoTenant.id);
             await updateDoc(demoDocRef, { name: 'MegaCorp (Demo)', plan: 'team' });
             const finalTenant = await getDoc(demoDocRef);
             const tenantData = finalTenant.data() as Omit<Tenant, 'limits'>;
             return sanitizeData({ ...tenantData, id: finalTenant.id, limits: getLimitsForTenant(tenantData) });
        }
        return null;
    }
    
    const tenantData = tenantDoc.data() as Omit<Tenant, 'limits'>;
    const tenantWithData = { ...tenantData, id: tenantDoc.id, limits: getLimitsForTenant(tenantData) };
    return sanitizeData(tenantWithData);
}

export async function updateTenant(tenantId: string, updates: Partial<Omit<Tenant, 'id' | 'subdomain' | 'limits'>>): Promise<Tenant | null> {
    const tenantDocRef = doc(db, 'tenants', tenantId);
    await updateDoc(tenantDocRef, updates);
    return getTenantBySubdomain(tenantId);
}
