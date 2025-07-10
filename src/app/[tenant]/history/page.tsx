
import { redirect } from 'next/navigation';

export default async function HistoryPage({ params }: { params: { tenant: string }}) {
  // This page is now merged with the RFPs page.
  // Redirect to the new consolidated view.
  const { tenant: tenantSubdomain } = params;
  redirect(`/${tenantSubdomain}/rfps`);
}
