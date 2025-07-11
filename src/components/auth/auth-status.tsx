"use client"

import { useUser } from '@auth0/nextjs-auth0/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AuthStatus() {
  const { user, error, isLoading } = useUser();
  const [isAuth0Configured, setIsAuth0Configured] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if Auth0 is configured by trying to access the /me endpoint
    fetch('/api/auth/me')
      .then(response => {
        if (response.status === 200) {
          return response.json();
        }
        throw new Error('Auth0 not configured');
      })
      .then(data => {
        setIsAuth0Configured(data.message ? false : true);
      })
      .catch(() => {
        setIsAuth0Configured(false);
      });
  }, []);

  if (isAuth0Configured === null) {
    return null; // Still checking
  }

  if (!isAuth0Configured) {
    return (
      <Alert className="mb-4 border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Auth0 Not Configured</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Authentication is currently in demo mode. To enable full authentication:
          <ol className="mt-2 list-decimal list-inside space-y-1">
            <li>Create an Auth0 application at <a href="https://auth0.com" target="_blank" rel="noopener noreferrer" className="underline">auth0.com</a></li>
            <li>Run <code className="bg-yellow-100 px-1 rounded">node complete-auth0-setup.js</code> to configure credentials</li>
            <li>Restart the development server</li>
          </ol>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Alert className="mb-4">
        <Shield className="h-4 w-4" />
        <AlertTitle>Checking Authentication...</AlertTitle>
        <AlertDescription>
          Verifying your authentication status.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Authentication Error</AlertTitle>
        <AlertDescription className="text-red-700">
          There was an issue with authentication: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (user) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Authenticated</AlertTitle>
        <AlertDescription className="text-green-700">
          Welcome, {user.name || user.email}! You are successfully authenticated.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Shield className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">Authentication Required</AlertTitle>
      <AlertDescription className="text-blue-700">
        Please log in to access this application.
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2"
          onClick={() => window.location.href = '/api/auth/login'}
        >
          Login
        </Button>
      </AlertDescription>
    </Alert>
  );
} 