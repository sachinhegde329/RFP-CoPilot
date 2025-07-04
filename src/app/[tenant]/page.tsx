
import { HomepageClient } from "@/components/dashboard/dashboard-client";
import { SidebarInset } from "@/components/ui/sidebar";

export default async function Homepage({ params }: { params: { tenant: string }}) {
    return (
        <SidebarInset className="flex-1 flex flex-col">
            {/* All content, including the header, is now managed by the client component to handle loading states and data dependencies. */}
            <HomepageClient />
        </SidebarInset>
    )
}
