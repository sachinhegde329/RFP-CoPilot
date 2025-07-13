
'use client'

import Link from "next/link";
import Image from "next/image"
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';

import { canPerformAction, hasFeatureAccess } from '@/lib/access-control';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { LockKeyhole, FileText, ExternalLink, CheckCircle, ShieldAlert, X, Loader2, ShieldCheck } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/components/providers/tenant-provider";
import { updateSecuritySettingsAction } from "@/app/actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SecuritySettingsPage() {
  const { tenant, setTenant } = useTenant();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [is2faEnabled, setIs2faEnabled] = useState(false); // Mock state
  const [newDomain, setNewDomain] = useState("");
  const [isUpdatingDomains, setIsUpdatingDomains] = useState(false);

  useEffect(() => {
    const ssoSuccess = searchParams.get('sso_success');
    const ssoError = searchParams.get('sso_error');
    if (ssoSuccess) {
      toast({
        title: "SSO Configured Successfully",
        description: `Your workspace is now configured for Single Sign-On with ${ssoSuccess}.`,
      });
      // Clean the URL
      router.replace(`/${tenant.subdomain}/settings/security`);
    } else if (ssoError) {
       toast({
        variant: "destructive",
        title: "SSO Configuration Failed",
        description: `Could not configure Single Sign-On with ${ssoError}. Please try again.`,
      });
      // Clean the URL
      router.replace(`/${tenant.subdomain}/settings/security`);
    }
  }, [searchParams, router, toast, tenant.subdomain]);


  const currentUser = tenant.members[0];
  const canManageSecurity = canPerformAction(currentUser.role, 'manageSecurity');
  const canManageSso = hasFeatureAccess(tenant, 'sso');

  const isMicrosoftSsoConfigured = tenant.ssoProvider === 'microsoft';
  const isOktaSsoConfigured = tenant.ssoProvider === 'okta';
  const isGoogleSsoConfigured = tenant.ssoProvider === 'google';
  
  const handleToggle2FA = (enabled: boolean) => {
      setIs2faEnabled(enabled);
      toast({
          title: `Two-Factor Authentication ${enabled ? 'Enabled' : 'Disabled'}`,
          description: `All users will be ${enabled ? 'required' : 'prompted'} to set up 2FA on their next login.`,
      });
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim() || !newDomain.includes('.')) {
        toast({ variant: 'destructive', title: 'Invalid Domain' });
        return;
    }
    setIsUpdatingDomains(true);
    const newDomains = [...tenant.domains, newDomain.trim().toLowerCase()];
    const result = await updateSecuritySettingsAction(tenant.id, { domains: newDomains });
    
    if (result.error || !result.tenant) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      setTenant(prev => ({ ...prev, domains: result.tenant!.domains }));
      toast({ title: 'Domain Added' });
      setNewDomain('');
    }
    setIsUpdatingDomains(false);
  };
  
  const handleRemoveDomain = async (domainToRemove: string) => {
    setIsUpdatingDomains(true);
    const newDomains = tenant.domains.filter(d => d !== domainToRemove);
    const result = await updateSecuritySettingsAction(tenant.id, { domains: newDomains });
    
    if (result.error || !result.tenant) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      setTenant(prev => ({ ...prev, domains: result.tenant!.domains }));
      toast({ title: 'Domain Removed' });
    }
    setIsUpdatingDomains(false);
  };


  return (
    <TooltipProvider>
      <Card className="flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your workspace's security settings, including authentication methods and access policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2">
                <ShieldCheck className="text-primary"/>
                <span className="text-xs font-medium">SOC 2 Ready</span>
            </div>
            <div className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2">
                <ShieldCheck className="text-primary"/>
                <span className="text-xs font-medium">GDPR Compliant</span>
            </div>
            <div className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2">
                <ShieldCheck className="text-primary"/>
                <span className="text-xs font-medium">SSO & RBAC</span>
            </div>
            <div className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2">
                <ShieldCheck className="text-primary"/>
                <span className="text-xs font-medium">Data Encryption</span>
            </div>
          </div>

          <Separator />
          
          {/* 2FA Section */}
          <div>
            <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security to your account by requiring a second authentication step.</p>
            <div className="pt-4">
              <fieldset disabled={!canManageSecurity}>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                      <Label htmlFor="2fa-switch" className="font-medium">Enable 2FA for all members</Label>
                      <p className="text-sm text-muted-foreground">
                          Once enabled, members will be prompted to set up 2FA on their next login.
                      </p>
                      </div>
                      <Switch id="2fa-switch" checked={is2faEnabled} onCheckedChange={handleToggle2FA} />
                  </div>
              </fieldset>
            </div>
          </div>

          <Separator />

          {/* SSO Section */}
          <div>
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5" />
              <h3 className="text-lg font-medium">Single Sign-On (SSO)</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Allow your team to sign in using your company's identity provider.
            </p>
            <div className="space-y-4 pt-4">
              {!canManageSso && (
                  <Alert>
                      <ShieldAlert className="h-4 w-4" />
                      <AlertTitle>Enterprise Feature</AlertTitle>
                      <AlertDescription>
                          Single Sign-On (SSO) is available on the Enterprise plan. 
                          <Button asChild variant="link" className="p-0 h-auto ml-1">
                              <Link href={`/pricing?tenant=${tenant.subdomain}`}>Upgrade Your Plan</Link>
                          </Button>
                      </AlertDescription>
                  </Alert>
              )}
              <fieldset disabled={!canManageSecurity || !canManageSso}>
                  <div className="flex flex-col sm:flex-row gap-4">
                      {isOktaSsoConfigured ? (
                          <Button variant="outline" className="w-full sm:w-auto justify-start gap-2" disabled>
                              <CheckCircle className="text-green-600" />
                              Configured with Okta
                          </Button>
                      ) : (
                          <Button variant="outline" className="w-full sm:w-auto justify-start gap-2" asChild>
                              <Link href={`/api/auth/sso/okta/initiate?tenantId=${tenant.id}`}>
                                  <Image src="https://i.ibb.co/TMbzkqmG/Google-AI-Studio-2025-07-13-T11-25-43-726-Z.png" alt="Okta logo" width={20} height={20} data-ai-hint="okta logo" className="object-cover" />
                                  Configure with Okta
                              </Link>
                          </Button>
                      )}
                      {isMicrosoftSsoConfigured ? (
                          <Button variant="outline" className="w-full sm:w-auto justify-start gap-2" disabled>
                              <CheckCircle className="text-green-600" />
                              Configured with Azure AD
                          </Button>
                      ) : (
                          <Button variant="outline" className="w-full sm:w-auto justify-start gap-2" asChild>
                              <Link href={`/api/auth/sso/microsoft/initiate?tenantId=${tenant.id}`}>
                              <Image src="https://i.ibb.co/TMbzkqmG/Google-AI-Studio-2025-07-13-T11-25-43-726-Z.png" alt="Azure AD logo" width={20} height={20} data-ai-hint="azure logo" className="object-cover"/>
                              Configure with Azure AD
                              </Link>
                          </Button>
                      )}
                       {isGoogleSsoConfigured ? (
                          <Button variant="outline" className="w-full sm:w-auto justify-start gap-2" disabled>
                              <CheckCircle className="text-green-600" />
                              Configured with Google
                          </Button>
                      ) : (
                          <Button variant="outline" className="w-full sm:w-auto justify-start gap-2" asChild>
                             <Link href={`/api/auth/sso/google/initiate?tenantId=${tenant.id}`}>
                                <Image src="https://i.ibb.co/TMbzkqmG/Google-AI-Studio-2025-07-13-T11-25-43-726-Z.png" alt="Google logo" width={20} height={20} data-ai-hint="google logo" className="object-cover"/>
                                Configure with Google
                              </Link>
                          </Button>
                      )}
                  </div>
              </fieldset>
              <p className="text-sm text-muted-foreground">
                  Need a different provider? <a href="#" className="text-primary underline">Contact us</a>.
              </p>
            </div>
          </div>
          
          <Separator />

          {/* Allowed Email Domains Section */}
          <div>
            <h3 className="text-lg font-medium">Allowed Email Domains</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Restrict new member invitations to specific email domains.
            </p>
            <div className="pt-4">
              <fieldset disabled={!canManageSecurity || isUpdatingDomains}>
                  <div className="flex gap-2">
                      <Input placeholder="example.com" value={newDomain} onChange={e => setNewDomain(e.target.value)} />
                      <Button onClick={handleAddDomain} disabled={!newDomain.trim()}>
                        {isUpdatingDomains && <Loader2 className="animate-spin" />}
                        Add Domain
                      </Button>
                  </div>
                  <div className="mt-4 space-y-2">
                      {tenant.domains.map(domain => (
                        <div key={domain} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <span className="text-sm font-mono">{domain}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveDomain(domain)}>
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Remove domain {domain}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove domain</p>
                              </TooltipContent>
                            </Tooltip>
                        </div>
                      ))}
                      {tenant.domains.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No domain restrictions. Anyone can be invited.</p>
                      )}
                  </div>
              </fieldset>
            </div>
          </div>

          <Separator />
          
          {/* Audit Logs Section */}
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h3 className="text-lg font-medium">Audit Logs</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Track important events that happen within your workspace. Audit logs are retained for 90 days.
            </p>
            <div className="pt-4">
              <Button variant="outline" disabled={!canManageSecurity}>
                  View Audit Logs
                  <ExternalLink className="ml-2" />
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
