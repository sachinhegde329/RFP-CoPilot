
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useFirebase } from '@/components/providers/firebase-provider';
import { findOrCreateTenantForUserAction } from '@/app/actions';

export default function SignUpPage() {
  const firebase = useFirebase();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!firebase) {
      // Firebase might not be initialized yet, wait for the provider.
      return;
    }
    const { auth } = firebase;
    const processRedirectResult = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
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
                        title: 'Sign Up Failed',
                        description: actionResult.error || "Could not create a workspace for your account.",
                    });
                    setIsAuthLoading(false);
                } else {
                    router.push(`/${actionResult.tenant.subdomain}`);
                }
            } else {
                setIsAuthLoading(false);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Sign-up Error',
                description: error.message || 'An unknown error occurred during sign-up.',
            });
            setIsAuthLoading(false);
        }
    };
    
    processRedirectResult();
  }, [router, toast, firebase]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebase) return;
    const { auth } = firebase;
    setIsAuthLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update user's profile with their name
        await updateProfile(user, { displayName: name });

        const actionResult = await findOrCreateTenantForUserAction({
            uid: user.uid,
            email: user.email,
            displayName: name, // Use the name from the form
            photoURL: user.photoURL,
        });

        if (actionResult.error || !actionResult.tenant) {
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: actionResult.error || "Could not create a workspace.",
            });
            setIsAuthLoading(false);
        } else {
            router.push(`/${actionResult.tenant.subdomain}`);
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Sign-up Error',
            description: error.code === 'auth/email-already-in-use' 
                ? 'This email is already in use. Please log in.' 
                : (error.message || 'An unknown error occurred.'),
        });
        setIsAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!firebase) return;
    const { auth } = firebase;
    setIsAuthLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };
  
  const isFirebaseReady = !!firebase;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center space-y-6">
        <div className="flex items-center gap-2 text-center">
          <FileBox className="size-8 text-primary" />
          <h1 className="text-2xl font-semibold">RFP CoPilot</h1>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              Enter your information to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleEmailSignUp} className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isAuthLoading || !isFirebaseReady}
              />
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isAuthLoading || !isFirebaseReady}
              />
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isAuthLoading || !isFirebaseReady}
              />
              <Button type="submit" className="w-full mt-2" disabled={isAuthLoading || !isFirebaseReady}>
                {(isAuthLoading || !isFirebaseReady) && <Loader2 className="mr-2 animate-spin" />}
                Create Account
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

            <Button onClick={handleGoogleSignIn} disabled={isAuthLoading || !isFirebaseReady} variant="outline" className="w-full">
              <Image src="https://placehold.co/20x20.png" alt="Google logo" width={16} height={16} data-ai-hint="google logo" className="mr-2"/>
              Sign up with SSO
            </Button>
            
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

            <Button asChild variant="secondary" className="w-full">
                <a href="/megacorp">Live Demo</a>
            </Button>

             <p className="text-center text-sm text-muted-foreground mt-2">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Log in
                </Link>
            </p>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
