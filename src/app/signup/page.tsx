'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Separator } from '@/components/ui/separator';
import { FileBox, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/megacorp';
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Firebase Not Configured',
        description: 'Please provide Firebase configuration to enable sign up.',
      });
      return;
    }
    setIsLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // In a real app, create tenant, etc.
      router.push(redirectUrl); 
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Firebase Not Configured',
        description: 'Please provide Firebase configuration to enable sign up.',
      });
      return;
    }
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        router.push(redirectUrl);
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Google Sign Up Failed',
            description: error.message,
        });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center space-y-6">
        <div className="flex items-center gap-2 text-center">
          <FileBox className="size-8 text-primary" />
          <h1 className="text-2xl font-semibold">RFP CoPilot</h1>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>
              Get started with your 14-day free trial.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignUp}>
            <CardContent className="grid gap-4">
              <Button variant="outline" type="button" onClick={handleGoogleSignUp} disabled={isGoogleLoading || isLoading}>
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Image src="https://placehold.co/20x20.png" alt="Google logo" width={16} height={16} data-ai-hint="google logo" className="mr-2" />
                )}
                Sign up with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                    placeholder="6+ characters"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                 {isLoading && <Loader2 className="mr-2 animate-spin" />}
                Create Account
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex-col items-start gap-4">
            <div className="text-sm text-center w-full">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Log in
                </Link>
            </div>
             <Separator />
            <Button variant="secondary" className="w-full" asChild>
                <Link href="/megacorp">Explore Live Demo</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
