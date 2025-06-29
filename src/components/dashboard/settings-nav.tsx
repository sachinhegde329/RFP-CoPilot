'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTenant } from "@/components/providers/tenant-provider"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { User, Users, CreditCard, Settings as SettingsIcon } from "lucide-react"

export function SettingsNav() {
    const pathname = usePathname();
    const { tenant } = useTenant();

    const navItems = [
        { href: `/${tenant.subdomain}/settings/team`, label: "Team Members", icon: Users },
        { href: `/${tenant.subdomain}/settings/billing`, label: "Billing", icon: CreditCard },
        { href: `/${tenant.subdomain}/settings/profile`, label: "My Profile", icon: User },
        { href: `/${tenant.subdomain}/settings/workspace`, label: "Workspace", icon: SettingsIcon },
    ];

    return (
        <aside className="flex flex-col w-full md:w-1/5 shrink-0">
            <nav className="flex flex-row md:flex-col gap-1">
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
