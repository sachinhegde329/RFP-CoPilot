
"use client"

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const { user, error, isLoading } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if Auth0 is configured
    const isAuth0Configured = !!(process.env.NEXT_PUBLIC_AUTH0_DOMAIN && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID);
    
    if (!isAuth0Configured) {
      // If Auth0 is not configured, allow access (for demo purposes)
      setIsChecking(false);
      return;
    }

    if (!isLoading) {
      if (error) {
        console.error('Auth0 error:', error);
        setIsChecking(false);
      } else if (!user) {
        // Redirect to login if not authenticated
        router.push('/api/auth/login');
      } else {
        setIsChecking(false);
      }
    }
  }, [user, error, isLoading, router]);

  // Show loading state
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Authentication Error
            </CardTitle>
            <CardDescription>
              There was an issue with authentication. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Error: {error.message}
              </p>
              <Button 
                onClick={() => router.push('/api/auth/login')}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has required role
  if (requiredRole && user) {
    const userRoles = (user['https://your-app.com/roles'] as string[]) || [];
    if (!userRoles.includes(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Access Denied
              </CardTitle>
              <CardDescription>
                You don't have permission to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Required role: {requiredRole}
                </p>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Show fallback or children
  if (!user && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
