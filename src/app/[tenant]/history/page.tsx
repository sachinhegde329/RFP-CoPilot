
import { redirect } from 'next/navigation';

export default function HistoryPage({ params }: { params: { tenant: string }}) {
  // This page is now merged with the RFPs page.
  // Redirect to the new consolidated view.
  redirect(`/${params.tenant}/rfps`);
}
