
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileBox, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { findOrCreateTenantForUserAction } from '@/app/actions';


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if(user) {
        const actionResult = await findOrCreateTenantForUserAction({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        });
        
        if (actionResult.error || !actionResult.tenant) {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: actionResult.error || "Could not find or create a workspace for your account.",
            });
             setIsLoading(false);
        } else {
            router.push(`/${actionResult.tenant.subdomain}`);
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign-in Error',
        description: error.message || 'An unknown error occurred during sign-in.',
      });
      setIsLoading(false);
    }
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
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to your workspace to continue.
            </CardDescription>
          </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button onClick={handleGoogleSignIn} disabled={isLoading} variant="outline" className="w-full">
                 {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Image src="https://placehold.co/20x20.png" alt="Google logo" width={16} height={16} data-ai-hint="google logo" className="mr-2"/>
                  )}
                Continue with Google
              </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
