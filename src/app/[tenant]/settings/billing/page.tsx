
'use client'

import { useState } from 'react';
import { useTenant } from '@/components/providers/tenant-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { createCustomerPortalSessionAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { addOnsConfig } from '@/lib/tenants';

export default function BillingSettingsPage() {
    const { tenant } = useTenant();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleManageSubscription = async () => {
        setIsLoading(true);
        const result = await createCustomerPortalSessionAction(tenant.id);
        
        if (result.error || !result.portalUrl) {
            toast({
                variant: 'destructive',
                title: "Error",
                description: result.error || "Could not open billing portal.",
            });
            setIsLoading(false);
            return;
        }
        
        // Redirect to Stripe Customer Portal
        window.location.href = result.portalUrl;
    }

  return (
    <Card className="flex flex-col h-full">
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
          {tenant.plan === 'free' ? (
              <Button asChild>
                  <a href={`/pricing?tenant=${tenant.id}`}>Upgrade Your Plan</a>
              </Button>
          ) : (
             <Button onClick={handleManageSubscription} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <ExternalLink />}
                Manage Subscription
            </Button>
          )}

      </CardFooter>
    </Card>
  )
}
