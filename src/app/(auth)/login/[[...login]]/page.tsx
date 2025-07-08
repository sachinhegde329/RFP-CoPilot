import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// This page is now a fallback. Auth0 handles the main login flow.
export default function Page() {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Log In</CardTitle>
            <CardDescription>
                You are being redirected to the login page.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild className="w-full">
                <a href="/api/auth/login">Continue to Log In</a>
            </Button>
        </CardContent>
    </Card>
  );
}
