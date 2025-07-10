
import { getTenantBySubdomain } from "@/lib/tenants";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge';
import { addOnsConfig } from '@/lib/tenants';
import { BillingClient } from './billing-client';

export default async function BillingSettingsPage({ params }: { params: Promise<{ tenant: string }>}) {
    const { tenant: tenantSubdomain } = await params;
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
        notFound();
    }

    return (
        <Card className="flex flex-col flex-1">
            <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>
                Manage your subscription, payment methods, and view invoices.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
                <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium">Current Plan</h3>
                        <Badge variant="secondary" className="capitalize text-base">{tenant.plan}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Seats</p>
                        <p>{tenant.limits.seats}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">File Size Limit</p>
                        <p>{tenant.limits.fileSizeMb}MB</p>
                    </div>
                </div>
                
                {tenant.addOns && tenant.addOns.length > 0 && (
                    <div className="p-4 border rounded-lg space-y-3">
                        <h3 className="font-medium">Active Add-ons</h3>
                        {tenant.addOns.map(addOnId => {
                            const addOn = addOnsConfig[addOnId];
                            if (!addOn) return null;
                            return (
                                <div key={addOn.id} className="flex justify-between items-center text-sm pt-2 border-t first:border-t-0 first:pt-0">
                                    <div>
                                        <p className="font-medium">{addOn.name}</p>
                                    </div>
                                    <p className="font-semibold text-muted-foreground">${addOn.price}/mo</p>
                                </div>
                            );
                        })}
                    </div>
                )}

            </CardContent>
            <CardFooter>
                <BillingClient tenantId={tenant.id} tenantPlan={tenant.plan} />
            </CardFooter>
        </Card>
    );
}
