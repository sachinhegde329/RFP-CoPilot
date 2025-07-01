
import { HomepageClient } from "@/components/dashboard/dashboard-client";
import { SidebarInset } from "@/components/ui/sidebar";

export default async function Homepage({ params, searchParams }: { params: { tenant: string }, searchParams: { [key: string]: string | string[] | undefined }}) {
    return (
        <SidebarInset className="flex-1 flex flex-col">
            {/* All content, including the header, is now managed by the client component to handle loading states and data dependencies. */}
            <HomepageClient searchParams={searchParams} />
        </SidebarInset>
    )
}
