
'use client';

// Firebase authentication has been removed. This component now acts as a pass-through.
// It is kept to avoid breaking imports but no longer provides any guarding functionality.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
