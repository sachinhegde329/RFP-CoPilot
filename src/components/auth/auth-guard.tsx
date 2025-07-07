
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseEnabled } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

// A simple, generic loading skeleton that doesn't need tenant context.
function AuthSkeleton() {
    return (
        <div className="flex h-screen w-full">
            <div className="hidden md:block border-r p-2">
                <div className="flex flex-col h-full gap-2">
                    <Skeleton className="h-7 w-7 mx-auto"/>
                    <div className="flex-1 flex flex-col gap-1 mt-4">
                        <Skeleton className="h-8 w-8 mx-auto rounded-md" />
                        <Skeleton className="h-8 w-8 mx-auto rounded-md" />
                        <Skeleton className="h-8 w-8 mx-auto rounded-md" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-8 w-8 mx-auto rounded-md" />
                         <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                    </div>
                </div>
            </div>
            <div className="flex-1 p-8">
                 <Skeleton className="h-12 w-1/3 mb-6" />
                 <Skeleton className="h-96 w-full" />
            </div>
        </div>
    )
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const firebaseEnabled = isFirebaseEnabled();

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseEnabled]);

  useEffect(() => {
    if (firebaseEnabled && !loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname, firebaseEnabled]);

  if (loading) {
    return <AuthSkeleton />;
  }

  if (firebaseEnabled && !user) {
    // This state is brief before the redirect happens, but good to have a fallback UI.
    return <AuthSkeleton />;
  }

  // If user is authenticated (or Firebase is disabled), render the children.
  return <>{children}</>;
}
