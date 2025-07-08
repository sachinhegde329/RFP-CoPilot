
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';

/**
 * This page acts as a server-side router after a user authenticates.
 * It checks the user's status and redirects them to the appropriate page.
 */
export default async function DashboardPage() {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    // If no user, redirect to login. This is a fallback, middleware should handle this.
    redirect('/api/auth/login');
  }

  // With the simplified tenancy model, the user's workspace subdomain is their user ID (`sub`).
  const workspaceSubdomain = user.sub;

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  redirect(`${protocol}://${workspaceSubdomain}.${rootDomain}`);

  // This component will never render anything as it always redirects.
  return null;
}
