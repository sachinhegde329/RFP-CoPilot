
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
              <SidebarMenuButton asChild isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton asChild isActive={isSettingsActive} tooltip="Settings">
              <Link href={settingsPath}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="My Account">
              <Link href={`/${tenant.subdomain}/settings/profile`}>
                <Avatar className="size-4">
                  <AvatarImage src="https://i.ibb.co/TMbzkqmG/Google-AI-Studio-2025-07-13-T11-25-43-726-Z.png" />
                  <AvatarFallback>
                    <CircleUserRound />
                  </AvatarFallback>
                </Avatar>
                <span>My Account</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
