
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileBox } from 'lucide-react';

export default function LoginPage() {
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
              Firebase has been disabled. You can explore the application using the live demo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild>
                <Link href="/megacorp">Explore Live Demo</Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-2">
                Want to sign up? Re-enable Firebase to create an account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
