import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// This page is now a fallback. Auth0 handles the main signup flow.
export default function Page() {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
                You are being redirected to the sign-up page.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild className="w-full">
                <a href="/api/auth/signup">Continue to Sign Up</a>
            </Button>
        </CardContent>
    </Card>
  );
}
