
import { redirect } from 'next/navigation';
import { getTenantBySubdomain } from '@/lib/tenants';
import { canPerformAction, type Action } from '@/lib/access-control';

type SettingsPageProps = {
  params: { tenant: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { tenant: tenantSubdomain } = params;
  const tenant = await getTenantBySubdomain(tenantSubdomain);
  if (!tenant) {
    // This case should be handled by layout, but for safety:
    redirect('/');
  }
  // Because of the logic in getTenantBySubdomain, the first user is always the current user.
  const currentUser = tenant.members[0];
  if (!currentUser) {
      // User might not be logged in or part of the org, redirect to the root which will handle auth.
      redirect('/');
  }

  // Define the settings pages and their required permissions.
  // The order determines the redirect priority.
  const settingsRoutes = [
    { path: 'dashboard', permission: 'manageTeam' }, // Admins/Owners see this first
    { path: 'profile', permission: 'viewContent' }, // Personal, always available
    { path: 'referrals', permission: 'viewContent' }, 
    { path: 'workspace', permission: 'editWorkspace' },
    { path: 'team', permission: 'manageTeam' },
    { path: 'billing', permission: 'manageTeam' },
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
  // A viewer-only role might end up here, so redirecting to their profile is a safe fallback.
  redirect(`/${tenant.subdomain}/settings/profile`);
}
