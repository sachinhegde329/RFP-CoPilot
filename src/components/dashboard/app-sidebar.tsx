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
} from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import Image from "next/image"

export function AppSidebar() {
  const { tenant } = useTenant();

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
            <SidebarMenuButton href="#" isActive>
              <LayoutDashboard />
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <FileText />
              RFPs
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <Database />
              Knowledge Base
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <Blocks />
              Templates
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <BarChartHorizontalBig />
              Analytics
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <Settings />
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <Avatar className="size-6">
                <AvatarImage src="https://placehold.co/100x100" />
                <AvatarFallback>
                  <CircleUserRound />
                </AvatarFallback>
              </Avatar>
              My Account
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
