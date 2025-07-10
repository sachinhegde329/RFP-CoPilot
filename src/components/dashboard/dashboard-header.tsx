"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { Bell, CheckCircle, CircleUserRound, MessageSquare, UserPlus, Loader2, Sun, Moon, Search, Command } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import { getNotificationsAction, markNotificationsAsReadAction } from "@/app/actions"
import type { Notification } from "@/lib/notifications.service"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AskAiDialog } from "./ask-ai-dialog"
import { useUser } from '@auth0/nextjs-auth0/client'
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import Link from 'next/link';


function getNotificationIcon(type: string) {
    const className = "h-4 w-4 text-muted-foreground"
    switch (type) {
        case 'assignment': return <UserPlus className={className} />;
        case 'comment': return <MessageSquare className={className} />;
        case 'review': return <CircleUserRound className={className} />;
        case 'status': return <CheckCircle className={className} />;
        default: return null;
    }
}


export function HomepageHeader() {
  const { tenant } = useTenant()
  const { toast } = useToast()
  const { setTheme } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);
  const { user } = useUser();

  const currentUser = tenant.members[0];

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    // This feature is currently disabled post-migration
  }, [tenant.id, currentUser, toast]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsAskAiOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  
  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => ({...n, isRead: true})));

    const result = await markNotificationsAsReadAction(tenant.id, currentUser.id);
    if (result.error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not mark notifications as read.",
        });
        setNotifications(prev => prev.map(n => ({...n, isRead: false})));
    }
  }


  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-4">
            <Image 
              src={tenant.branding.logoUrl} 
              alt={`${tenant.name} Logo`}
              width={128}
              height={32}
              className="h-8 w-auto"
              data-ai-hint={tenant.branding.logoDataAiHint}
            />
        </div>

        <div className="flex w-full flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full justify-start text-muted-foreground sm:w-64" onClick={() => setIsAskAiOpen(true)}>
              <Search className="mr-2"/>
              Ask AI...
              <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full relative" disabled>
                      <Bell className="h-5 w-5"/>
                      {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                      )}
                      <span className="sr-only">Toggle notifications</span>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications (Disabled)</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-center justify-center">Notifications are temporarily disabled.</DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>

            {user && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                {user.picture ? <AvatarImage src={user.picture} alt={user.name || 'User'} /> : null}
                                <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                            </p>
                        </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link href={`/${tenant.subdomain}/settings`}>Settings</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href="/api/auth/logout">Log out</a></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </header>
      <AskAiDialog open={isAskAiOpen} onOpenChange={setIsAskAiOpen} />
    </>
  )
}
