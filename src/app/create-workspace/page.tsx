
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

import { FileBox, PlusCircle, Building, User as UserIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { completeOnboardingAction } from '@/app/actions';
import { Button } from '@/components/ui/button';


export default function CreateWorkspacePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const showMockupToast = (action: string) => {
    toast({
      title: "Feature Not Implemented",
      description: `In a production app, ${action} would be handled via your Auth0 dashboard or email invitations.`,
    });
  };

  const handleContinueSolo = async () => {
    if (!user || !user.sub) return;
    setIsLoading(true);
    
    const result = await completeOnboardingAction(user.sub);

    if (result.error || !result.tenant) {
      toast({
        variant: 'destructive',
        title: "Setup Failed",
        description: result.error || "Could not create your personal workspace.",
      });
      setIsLoading(false);
    } else {
      toast({
        title: "Workspace Created!",
        description: "Redirecting you to your new dashboard.",
      });
      // Construct the URL and redirect
      const workspaceSubdomain = result.tenant.subdomain;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      window.location.href = `${protocol}://${workspaceSubdomain}.${rootDomain}`;
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileBox className="size-8 text-primary" />
            <h1 className="text-3xl font-bold">RFP CoPilot</h1>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome! Let's get you set up.</h2>
          <p className="text-muted-foreground mt-2">How would you like to get started?</p>
        </div>
        
        <div className="space-y-4">
          <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => showMockupToast('creating a new workspace')}>
            <CardHeader className="flex flex-row items-center gap-4">
              <PlusCircle className="size-8 text-primary flex-shrink-0" />
              <div>
                <CardTitle>Create a Company Workspace</CardTitle>
                <CardDescription>Set up a new, shared workspace for your team.</CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => showMockupToast('joining a workspace')}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Building className="size-8 text-primary flex-shrink-0" />
              <div>
                <CardTitle>Join a Workspace</CardTitle>
                <CardDescription>Use an email invitation to join an existing team.</CardDescription>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="hover:border-primary transition-colors cursor-pointer" onClick={handleContinueSolo}>
            <CardHeader className="flex flex-row items-center gap-4">
              <UserIcon className="size-8 text-primary flex-shrink-0" />
              <div>
                <CardTitle>Continue as a Solo User</CardTitle>
                <CardDescription>Create a personal workspace for your own projects.</CardDescription>
              </div>
            </CardHeader>
             {isLoading && (
                <CardContent>
                    <Button disabled className="w-full">
                        <Loader2 className="animate-spin mr-2" />
                        Creating your workspace...
                    </Button>
                </CardContent>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
