
import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, arrayUnion, DocumentData } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { type Tenant, type TeamMember, plansConfig } from './tenant-types';

export * from './tenant-types';


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
  return sanitizeData(tenantWithLimits);
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
