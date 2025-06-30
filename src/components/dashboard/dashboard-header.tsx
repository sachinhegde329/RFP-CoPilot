
"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, Bot, CheckCircle, CircleUserRound, MessageSquare, UserPlus } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"


const notifications = [
    {
        id: 1,
        type: 'assignment',
        user: { name: 'Alex Johnson' },
        text: "assigned 'Data Retention Policy' to you.",
        time: '5m ago'
    },
    {
        id: 2,
        type: 'comment',
        user: { name: 'Maria Garcia' },
        text: "mentioned you on 'SLA for uptime'",
        time: '1h ago'
    },
    {
        id: 3,
        type: 'review',
        user: { name: 'AI Expert' },
        text: "review for 'Pricing Structure' is complete.",
        time: '3h ago'
    },
    {
        id: 4,
        type: 'status',
        user: { name: 'Priya Patel' },
        text: "marked 'CRM Integration' as Completed.",
        time: '1d ago'
    }
];

function getNotificationIcon(type: string) {
    const className = "h-4 w-4 text-muted-foreground"
    switch (type) {
        case 'assignment': return <UserPlus className={className} />;
        case 'comment': return <MessageSquare className={className} />;
        case 'review': return <Bot className={className} />;
        case 'status': return <CheckCircle className={className} />;
        default: return null;
    }
}


export function DashboardHeader() {
  const { tenant } = useTenant()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <div className="flex-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{tenant.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5"/>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <span className="sr-only">Toggle notifications</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map(notification => (
                <DropdownMenuItem key={notification.id} className="flex items-start gap-3 whitespace-normal cursor-pointer">
                    <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm">
                            <span className="font-semibold">{notification.user.name}</span>
                            {' '}{notification.text}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center cursor-pointer">
                Mark all as read
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUserRound />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
