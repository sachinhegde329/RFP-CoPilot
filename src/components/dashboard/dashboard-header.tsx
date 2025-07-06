
"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, Bot, CheckCircle, CircleUserRound, MessageSquare, UserPlus, Loader2, Sun, Moon, Search } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import { getNotificationsAction, markNotificationsAsReadAction } from "@/app/actions"
import type { Notification } from "@/lib/notifications.service"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"


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


export function HomepageHeader({ rfpName }: { rfpName?: string }) {
  const { tenant } = useTenant()
  const { toast } = useToast()
  const { setTheme } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Assuming current user is the first member for this demo
  const currentUser = tenant.members[0];

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      const result = await getNotificationsAction(tenant.id, currentUser.id);
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
      } else {
        toast({
          variant: "destructive",
          title: "Could not load notifications",
          description: result.error,
        });
      }
      setIsLoading(false);
    };

    fetchNotifications();
  }, [tenant.id, currentUser, toast]);
  
  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    // Optimistically update UI
    setNotifications(prev => prev.map(n => ({...n, isRead: true})));

    const result = await markNotificationsAsReadAction(tenant.id, currentUser.id);
    if (result.error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not mark notifications as read.",
        });
        // Revert optimistic update on error
        setNotifications(prev => prev.map(n => ({...n, isRead: false})));
    }
  }


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">{tenant.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{ rfpName ? rfpName : 'Home'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
      </div>

      <div className="flex w-full flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search RFPs, answers..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5"/>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading ? (
                    <div className="flex justify-center items-center p-4">
                        <Loader2 className="animate-spin" />
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map(notification => (
                        <DropdownMenuItem key={notification.id} className={cn("flex items-start gap-3 whitespace-normal cursor-pointer", !notification.isRead && "font-semibold")}>
                            <div className="mt-1">
                                {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm">
                                    <span className="font-medium">{notification.actor.name}</span>
                                    {' '}{notification.text}
                                </p>
                                <p className={cn("text-xs", !notification.isRead ? "text-muted-foreground" : "text-muted-foreground/70")}>{notification.timestamp}</p>
                            </div>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <DropdownMenuItem disabled className="text-center justify-center">No notifications</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center cursor-pointer" onSelect={handleMarkAllAsRead} disabled={isLoading || unreadCount === 0}>
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
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                <Sun className="mr-2 h-4 w-4" />
                <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                    </DropdownMenuItem>
                </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
