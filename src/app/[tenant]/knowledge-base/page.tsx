import { SidebarInset } from "@/components/ui/sidebar"
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { KnowledgeBaseClient } from "@/components/knowledge-base/knowledge-base-client"
import { getKnowledgeSourcesAction } from "@/app/actions"
import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"

export default async function KnowledgeBasePage({
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
  const tenant = await getTenantBySubdomain(tenantSubdomain);
  if (!tenant) {
      notFound();
  }

  const sourcesResult = await getKnowledgeSourcesAction(tenant.id);
  // In a real app, you might want more robust error handling on the server.
  // For now, we'll pass empty initial data and let the client handle it.
  const initialSources = sourcesResult.sources || [];
  
  return (
    <SidebarInset className="flex-1 flex flex-col">
      <HomepageHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
        <KnowledgeBaseClient initialSources={initialSources} />
      </main>
    </SidebarInset>
  )
}
