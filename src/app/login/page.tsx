
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileBox, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { findOrCreateTenantForUserAction } from '@/app/actions';

export default function LoginPage() {
  const [isAuthLoading, setIsAuthLoading] = useState(true); // For redirect check and any auth action
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const processRedirectResult = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                // User successfully signed in and has been redirected back.
                const user = result.user;
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
                    setIsAuthLoading(false);
                } else {
                    router.push(`/${actionResult.tenant.subdomain}`);
                }
            } else {
                // No redirect result, user has just loaded the page normally.
                setIsAuthLoading(false);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Sign-in Error',
                description: error.message || 'An unknown error occurred during sign-in.',
            });
            setIsAuthLoading(false);
        }
    };
    
    processRedirectResult();
  }, [router, toast]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
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
                description: actionResult.error || "Could not find or create a workspace.",
            });
            setIsAuthLoading(false);
        } else {
            router.push(`/${actionResult.tenant.subdomain}`);
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Sign-in Error',
            description: error.code === 'auth/invalid-credential' 
                ? 'Invalid email or password.' 
                : (error.message || 'An unknown error occurred.'),
        });
        setIsAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
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
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Log in or continue as a guest to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleEmailSignIn} className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isAuthLoading}
              />
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isAuthLoading}
              />
              <Button type="submit" className="w-full mt-2" disabled={isAuthLoading}>
                {isAuthLoading && <Loader2 className="mr-2 animate-spin" />}
                Login with Email
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button onClick={handleGoogleSignIn} disabled={isAuthLoading} variant="outline" className="w-full">
              <Image src="https://placehold.co/20x20.png" alt="Google logo" width={16} height={16} data-ai-hint="google logo" className="mr-2"/>
              Continue with SSO
            </Button>
            
            <Button
              variant="link"
              className="w-full text-muted-foreground font-normal text-sm"
              onClick={() => router.push('/megacorp')}
              disabled={isAuthLoading}
            >
              Test without login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
