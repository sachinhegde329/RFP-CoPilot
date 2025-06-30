
"use client"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  FileText,
  Database,
  Blocks,
  BarChartHorizontalBig,
  Settings,
  CircleUserRound,
  History,
} from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function AppSidebar() {
  const { tenant } = useTenant();
  const pathname = usePathname();

  const dashboardPath = `/${tenant.subdomain}`;
  const settingsPath = `/${tenant.subdomain}/settings`;
  const isDashboardActive = pathname === dashboardPath;
  const isSettingsActive = pathname.startsWith(settingsPath);

  const navItems = [
    { href: `/${tenant.subdomain}/rfps`, label: "RFPs", icon: FileText },
    { href: `/${tenant.subdomain}/knowledge-base`, label: "Knowledge Base", icon: Database },
    { href: `/${tenant.subdomain}/templates`, label: "Templates", icon: Blocks },
    { href: `/${tenant.subdomain}/analytics`, label: "Analytics", icon: BarChartHorizontalBig },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center justify-center">
        <Image 
          src={tenant.branding.logoUrl} 
          alt={`${tenant.name} Logo`}
          width={128}
          height={32}
          className="h-8 w-auto"
          data-ai-hint={tenant.branding.logoDataAiHint}
        />
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isDashboardActive}>
              <Link href={dashboardPath}>
                <LayoutDashboard />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                <Link href={item.href}>
                  <item.icon />
                  {item.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton asChild isActive={isSettingsActive}>
              <Link href={settingsPath}>
                <Settings />
                Settings
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="#">
                <Avatar className="size-6">
                  <AvatarImage src="https://placehold.co/100x100" />
                  <AvatarFallback>
                    <CircleUserRound />
                  </AvatarFallback>
                </Avatar>
                My Account
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
