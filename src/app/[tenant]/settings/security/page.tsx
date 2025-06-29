'use client'

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from "next/link";
import Image from "next/image"

import { useTenant } from '@/components/providers/tenant-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { LockKeyhole, FileText, ExternalLink, CheckCircle } from "lucide-react"

export default function SecuritySettingsPage() {
  const { tenant } = useTenant();
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

  const isMicrosoftSsoConfigured = tenant.ssoProvider === 'microsoft';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring a second authentication step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="2fa-switch" className="font-medium">Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Once enabled, you'll be prompted to set up 2FA using an authenticator app.
              </p>
            </div>
            <Switch id="2fa-switch" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LockKeyhole />
            <CardTitle>Single Sign-On (SSO)</CardTitle>
          </div>
          <CardDescription>
            Allow your team to sign in using your company's identity provider. SSO is available on the Enterprise plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="w-full sm:w-auto justify-start gap-2" disabled>
                    <Image src="https://placehold.co/20x20.png" alt="Okta logo" width={20} height={20} data-ai-hint="okta logo" />
                    Configure with Okta
                </Button>
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
            <p className="text-sm text-muted-foreground">
                Need a different provider? <a href="#" className="text-primary underline">Contact us</a>.
            </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Allowed Email Domains</CardTitle>
          <CardDescription>
            Restrict new member invitations to specific email domains.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText />
            <CardTitle>Audit Logs</CardTitle>
          </div>
          <CardDescription>
            Track important events that happen within your workspace. Audit logs are retained for 90 days.
          </CardDescription>
        </CardHeader>
        <CardFooter>
            <Button variant="outline">
                View Audit Logs
                <ExternalLink className="ml-2" />
            </Button>
        </CardFooter>
      </Card>

    </div>
  )
}
