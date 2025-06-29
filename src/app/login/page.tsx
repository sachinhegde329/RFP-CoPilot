'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTenantByEmail } from '@/lib/tenants';
import { FileBox, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email required',
        description: 'Please enter your email to continue.',
      });
      return;
    }
    setIsLoading(true);

    const tenant = getTenantByEmail(email);

    if (tenant) {
      // In a real app, you'd handle auth here.
      // For now, we'll just redirect to the tenant's subdomain.
      const protocol = window.location.protocol;
      const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || window.location.host).replace(/www\./, '');
      window.location.href = `${protocol}//${tenant.subdomain}.${rootDomain}`;
    } else {
      // This path is taken if the email format is invalid or it's a free email provider
      toast({
        variant: 'destructive',
        title: 'Unsupported Email Provider',
        description:
          "Please use a valid work email to create a workspace. Personal email addresses are not supported.",
      });
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setIsGuestLoading(true);
    // Hardcode the free tenant 'megacorp' for testing
    const protocol = window.location.protocol;
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || window.location.host).replace(/www\./, '');
    window.location.href = `${protocol}//megacorp.${rootDomain}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center space-y-6">
        <div className="flex items-center gap-2 text-center">
          <FileBox className="size-8 text-primary" />
          <h1 className="text-2xl font-semibold">RFP CoPilot</h1>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign In or Sign Up</CardTitle>
            <CardDescription>
              Enter your work email to access your workspace or start a free trial.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isGuestLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading || isGuestLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : null}
                {isLoading ? 'Redirecting...' : 'Continue with Email'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGuestLogin}
                disabled={isLoading || isGuestLoading}
              >
                {isGuestLoading ? <Loader2 className="animate-spin" /> : null}
                {isGuestLoading ? 'Redirecting...' : 'Continue without login (for testing)'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
