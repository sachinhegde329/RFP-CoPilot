import { SidebarInset } from "@/components/ui/sidebar"
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { getTemplatesAction } from "@/app/actions"
import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"
import { TemplatesClient } from "./templates-client"

export default async function TemplatesPage({
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

  const currentUser = tenant.members[0];

  const result = await getTemplatesAction(tenant.id);
  
  if (result.error) {
    // In a real app, you might render an error component here.
    // For now, we'll proceed with an empty array, and the client will show a friendly message.
    console.error("Failed to load templates:", result.error);
  }
  const initialTemplates = result.templates || [];

  return (
    <SidebarInset className="flex-1 flex flex-col">
      <HomepageHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1">
        <TemplatesClient initialTemplates={initialTemplates} />
      </main>
    </SidebarInset>
  )
}
