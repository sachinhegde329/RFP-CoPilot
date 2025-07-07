"use client"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  FileText,
  Database,
  Blocks,
  BarChartHorizontalBig,
  Settings,
  CircleUserRound,
} from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function AppSidebar() {
  const { tenant } = useTenant();
  const pathname = usePathname();

  const settingsPath = `/${tenant.subdomain}/settings`;
  const isSettingsActive = pathname.startsWith(settingsPath);

  const navItems = [
    { href: `/${tenant.subdomain}`, label: "Home", icon: Home, exact: true },
    { href: `/${tenant.subdomain}/rfps`, label: "RFPs", icon: FileText },
    { href: `/${tenant.subdomain}/knowledge-base`, label: "Knowledge Base", icon: Database },
    { href: `/${tenant.subdomain}/templates`, label: "Templates", icon: Blocks },
    { href: `/${tenant.subdomain}/analytics`, label: "Analytics", icon: BarChartHorizontalBig },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}>
                <Link href={item.href}>
                  <item.icon />
                  {item.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
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
              <Link href={`/${tenant.subdomain}/settings/profile`}>
                <Avatar className="size-4">
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
