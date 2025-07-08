
'use client'

import { CreateOrganization, OrganizationList } from '@clerk/nextjs';
import { FileBox, PlusCircle, Building } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * A page to guide new users to either create a new workspace (organization)
 * or join an existing one they have been invited to.
 */
export default function CreateWorkspacePage() {
  const [view, setView] = useState<'options' | 'create'>('options');

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http';
  
  const getOrgUrl = (org: { slug: string }) => `${protocol}://${org.slug}.${rootDomain}`;

  if (view === 'create') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <CreateOrganization 
            afterCreateOrganizationUrl={getOrgUrl}
            skipInvitationScreen={true}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileBox className="size-8 text-primary" />
            <h1 className="text-3xl font-bold">RFP CoPilot</h1>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome! Let's get you set up.</h2>
          <p className="text-muted-foreground mt-2">How would you like to get started?</p>
        </div>
        
        <div className="space-y-4">
          <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => setView('create')}>
            <CardHeader className="flex flex-row items-center gap-4">
              <PlusCircle className="size-8 text-primary" />
              <div>
                <CardTitle>Create a Workspace</CardTitle>
                <CardDescription>Set up a new workspace for your company or personal projects.</CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-row items-center gap-4 mb-4">
                <Building className="size-8 text-primary" />
                <div>
                  <CardTitle>Join a Workspace</CardTitle>
                  <CardDescription>Accept an invitation or switch to an existing workspace.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OrganizationList
                hidePersonal={true}
                afterSelectOrganizationUrl={getOrgUrl}
                afterSelectPersonalUrl="/dashboard"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
