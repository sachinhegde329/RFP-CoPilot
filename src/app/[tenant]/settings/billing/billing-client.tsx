'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { createCustomerPortalSessionAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export function BillingClient({ tenantId, tenantPlan }: { tenantId: string; tenantPlan: 'free' | 'starter' | 'team' | 'business' | 'enterprise' }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleManageSubscription = async () => {
        setIsLoading(true);
        const result = await createCustomerPortalSessionAction(tenantId);
        
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

    if (tenantPlan === 'free') {
        return (
            <Button asChild>
                <a href="mailto:sales@rfpcopilot.com?subject=Upgrade%20Inquiry&body=Hello%20RFP%20CoPilot%20team%2C%0D%0A%0D%0AI'm%20interested%20in%20upgrading%20my%20plan.%20Please%20contact%20me%20with%20more%20information.%0D%0A%0D%0AThank%20you%2C%0D%0A%5BYour%20Name%5D">
                    Contact Sales
                </a>
            </Button>
        );
    }

    return (
        <Button onClick={handleManageSubscription} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <ExternalLink />}
            Manage Subscription
        </Button>
    );
}
