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
                <Link href={`/pricing?tenant=${tenantId}`}>Upgrade Your Plan</Link>
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
