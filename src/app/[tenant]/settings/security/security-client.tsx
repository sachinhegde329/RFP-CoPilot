'use client'

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function SecurityClient({ tenantSubdomain }: { tenantSubdomain: string }) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const ssoSuccess = searchParams.get('sso_success');
    const ssoError = searchParams.get('sso_error');
    if (ssoSuccess) {
      toast({
        title: "SSO Configured Successfully",
        description: `Your workspace is now configured for Single Sign-On with ${ssoSuccess}.`,
      });
      // Clean the URL
      router.replace(`/${tenantSubdomain}/settings/security`);
    } else if (ssoError) {
       toast({
        variant: "destructive",
        title: "SSO Configuration Failed",
        description: `Could not configure Single Sign-On with ${ssoError}. Please try again.`,
      });
      // Clean the URL
      router.replace(`/${tenantSubdomain}/settings/security`);
    }
  }, [searchParams, router, toast, tenantSubdomain]);

  return null;
}
