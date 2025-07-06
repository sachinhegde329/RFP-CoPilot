'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTenant } from "@/components/providers/tenant-provider"
import { getKnowledgeSourcesAction, getTemplatesAction } from "@/app/actions"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Database, Blocks, CreditCard, ArrowRight } from "lucide-react"

export function AdminDashboardView() {
    const { tenant } = useTenant();
    const [sourceCount, setSourceCount] = useState(0);
    const [templateCount, setTemplateCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const currentUser = tenant.members[0];

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const [sourcesResult, templatesResult] = await Promise.all([
                getKnowledgeSourcesAction(tenant.id),
                getTemplatesAction(tenant.id, currentUser)
            ]);
            if (sourcesResult.sources) setSourceCount(sourcesResult.sources.length);
            if (templatesResult.templates) setTemplateCount(templatesResult.templates.length);
            setIsLoading(false);
        }
        fetchData();
    }, [tenant.id, currentUser]);
    
    const adminCards = [
        { title: "Team Members", icon: Users, stat: `${tenant.members.length} / ${tenant.limits.seats} Seats`, description: "Invite new members and manage roles.", link: `/${tenant.subdomain}/settings/team`, cta: "Manage" },
        { title: "Knowledge Base", icon: Database, stat: `${sourceCount} Sources`, description: "Manage content sources and integrations.", link: `/${tenant.subdomain}/knowledge-base`, cta: "Manage" },
        { title: "Export Templates", icon: Blocks, stat: `${templateCount} Templates`, description: "Configure branded document templates.", link: `/${tenant.subdomain}/templates`, cta: "Manage" },
        { title: "Billing & Plan", icon: CreditCard, stat: `On ${tenant.plan} plan`, description: "Manage your subscription and view invoices.", link: `/${tenant.subdomain}/settings/billing`, cta: "Manage" },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {adminCards.map(card => (
                <Card key={card.title}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{card.title}</CardTitle>
                            <card.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                         <div className="text-3xl font-bold">{card.stat}</div>
                         <p className="text-xs text-muted-foreground pt-1">{card.description}</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={card.link}>
                                {card.cta} <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
