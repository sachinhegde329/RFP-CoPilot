
import { SidebarInset } from "@/components/ui/sidebar"
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { SettingsNav } from "@/components/dashboard/settings-nav"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset className="flex-1 flex flex-col">
      <HomepageHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your workspace settings, members, and billing.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
            <SettingsNav />
            <div className="flex-1">
                {children}
            </div>
        </div>
      </main>
    </SidebarInset>
  )
}
