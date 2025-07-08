
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * This page acts as a server-side router after a user authenticates.
 * It checks the user's organization status and redirects them to the
 * appropriate page.
 */
export default function DashboardPage() {
  const { orgId, orgSlug } = auth();

  // If the user has an active organization, redirect to their tenant dashboard
  // using the organization's slug as the subdomain.
  if (orgId && orgSlug) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    redirect(`${protocol}://${orgSlug}.${rootDomain}`);
  }
  
  // If the user has no organization, redirect them to the workspace creation page.
  // This handles users who have just signed up or have no organization memberships.
  else {
    redirect('/create-workspace');
  }

  // This component will never render anything as it always redirects.
  return null;
}
