
import Link from "next/link";
import Image from "next/image"

import { getTenantBySubdomain } from "@/lib/tenants";
import { notFound } from "next/navigation";
import { canPerformAction, hasFeatureAccess } from '@/lib/access-control';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { LockKeyhole, FileText, ExternalLink, CheckCircle, ShieldAlert } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { SecurityClient } from "./security-client";

export default function SecuritySettingsPage({ params }: { params: { tenant: string }}) {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
      notFound();
  }

  const currentUser = tenant.members[0];
  const canManageSecurity = canPerformAction(currentUser.role, 'manageSecurity');
  const canManageSso = hasFeatureAccess(tenant, 'sso');


  const isMicrosoftSsoConfigured = tenant.ssoProvider === 'microsoft';
  const isOktaSsoConfigured = tenant.ssoProvider === 'okta';

  return (
    <>
      <SecurityClient tenantSubdomain={tenant.subdomain} />
      <Card className="flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your workspace's security settings, including authentication methods and access policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-8">
          
          {/* 2FA Section */}
          <div>
            <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security to your account by requiring a second authentication step.</p>
            <div className="pt-4">
              <fieldset disabled={!canManageSecurity}>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                      <Label htmlFor="2fa-switch" className="font-medium">Enable 2FA</Label>
                      <p className="text-sm text-muted-foreground">
                          Once enabled, you'll be prompted to set up 2FA using an authenticator app.
                      </p>
                      </div>
                      <Switch id="2fa-switch" />
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
                                  <Image src="https://placehold.co/20x20.png" alt="Okta logo" width={20} height={20} data-ai-hint="okta logo" />
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
                              <Image src="https://placehold.co/20x20.png" alt="Azure AD logo" width={20} height={20} data-ai-hint="azure logo"/>
                              Configure with Azure AD
                              </Link>
                          </Button>
                      )}
                      <Button variant="outline" className="w-full sm:w-auto justify-start gap-2" disabled>
                          <Image src="https://placehold.co/20x20.png" alt="Google logo" width={20} height={20} data-ai-hint="google logo"/>
                          Configure with Google
                      </Button>
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
              <fieldset disabled={!canManageSecurity}>
                  <div className="flex gap-2">
                      <Input placeholder="example.com" />
                      <Button>Add Domain</Button>
                  </div>
                  <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <span className="text-sm font-mono">megacorp.com</span>
                          <Button variant="ghost" size="sm">Remove</Button>
                      </div>
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
    </>
  )
}
