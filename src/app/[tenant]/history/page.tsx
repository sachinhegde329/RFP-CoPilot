
import { redirect } from 'next/navigation';

// Using type assertion to work around the type issue
export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await both params and searchParams
  const [resolvedParams] = await Promise.all([
    params,
    searchParams || Promise.resolve({}),
  ]);
  const { tenant: tenantSubdomain } = resolvedParams;
  redirect(`/${tenantSubdomain}/rfps`);
}
