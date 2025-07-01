
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
  Home,
  FileText,
  Database,
  Blocks,
  BarChartHorizontalBig,
  Settings,
  CircleUserRound,
} from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function AppSidebar() {
  const { tenant } = useTenant();
  const pathname = usePathname();

  const homepagePath = `/${tenant.subdomain}`;
  const settingsPath = `/${tenant.subdomain}/settings`;
  const isHomepageActive = pathname === homepagePath;
  const isSettingsActive = pathname.startsWith(settingsPath);

  const navItems = [
    { href: `/${tenant.subdomain}`, label: "Home", icon: Home, exact: true },
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
              <Link href={`/${tenant.subdomain}/settings/profile`}>
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
