
import { redirect } from 'next/navigation';
import { getTenantBySubdomain } from '@/lib/tenants';
import { canPerformAction, type Action } from '@/lib/access-control';

export default function SettingsPage({ params }: { params: { tenant: string } }) {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
    // This case should be handled by layout, but for safety:
    redirect('/');
  }
  const currentUser = tenant.members[0];

  // Define the settings pages and their required permissions.
  // The order determines the redirect priority.
  const settingsRoutes = [
    { path: 'profile', permission: 'viewContent' }, // Personal, always available
    { path: 'referrals', permission: 'viewContent' }, 
    { path: 'workspace', permission: 'editWorkspace' },
    { path: 'team', permission: 'manageTeam' },
    { path: 'billing', permission: 'manageTeam' }, // Assuming billing is tied to team mgmt
    { path: 'security', permission: 'manageSecurity' }
  ];

  // Find the first page the user has access to.
  const firstAccessibleRoute = settingsRoutes.find(route => 
    canPerformAction(currentUser.role, route.permission as Action)
  );

  if (firstAccessibleRoute) {
    redirect(`/${tenant.subdomain}/settings/${firstAccessibleRoute.path}`);
  }

  // Fallback to the dashboard if no settings pages are accessible, which is unlikely.
  redirect(`/${tenant.subdomain}`);
}
