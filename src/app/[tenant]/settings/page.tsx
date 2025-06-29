import { redirect } from 'next/navigation';
import { getTenantBySubdomain } from '@/lib/tenants';

export default function SettingsPage({ params }: { params: { tenant: string } }) {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
    // This case should be handled by layout, but for safety:
    redirect('/');
  }
  // Redirect to the new default settings tab
  redirect(`/${tenant.subdomain}/settings/security`);
}
