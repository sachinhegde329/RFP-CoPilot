
'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTenant } from "@/components/providers/tenant-provider"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { User, Building, CreditCard, Settings as SettingsIcon, Shield, Gift } from "lucide-react"
import { canPerformAction, type Action } from "@/lib/access-control"

export function SettingsNav() {
    const pathname = usePathname();
    const { tenant } = useTenant();
    const currentUser = tenant.members[0];

    const allNavItems: { href: string; label: string; icon: React.ElementType; permission: Action }[] = [
        { href: `/${tenant.subdomain}/settings/profile`, label: "My Profile", icon: User, permission: 'viewContent' },
        { href: `/${tenant.subdomain}/settings/workspace`, label: "Workspace", icon: Building, permission: 'editWorkspace' },
        { href: `/${tenant.subdomain}/settings/team`, label: "Team Members", icon: Users, permission: 'manageTeam' },
        { href: `/${tenant.subdomain}/settings/billing`, label: "Billing", icon: CreditCard, permission: 'manageTeam' },
        { href: `/${tenant.subdomain}/settings/security`, label: "Security", icon: Shield, permission: 'manageSecurity' },
        { href: `/${tenant.subdomain}/settings/referrals`, label: "Referrals", icon: Gift, permission: 'viewContent' },
    ];
    
    // Filter the items based on user permissions.
    const navItems = allNavItems.filter(item => 
        canPerformAction(currentUser.role, item.permission)
    );

    return (
        <aside className="flex flex-col w-full md:w-1/5 shrink-0">
            <nav className="flex flex-row flex-wrap md:flex-col gap-1">
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start gap-2",
                            pathname.startsWith(item.href) ? "bg-muted font-semibold" : ""
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        <span className="hidden md:inline">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    )
}
