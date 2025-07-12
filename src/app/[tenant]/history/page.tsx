
import { redirect } from 'next/navigation';

type HistoryPageProps = {
  params: { tenant: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function HistoryPage({ params }: HistoryPageProps) {
  // This page is now merged with the RFPs page.
  // Redirect to the new consolidated view.
  const { tenant: tenantSubdomain } = params;
  redirect(`/${tenantSubdomain}/rfps`);
}
