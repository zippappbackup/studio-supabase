
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

const isLighthouseAuditMode = process.env.NEXT_PUBLIC_LIGHTHOUSE_AUDIT_MODE === 'true';

export function UserLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Skip all checks if in Lighthouse audit mode
    if (isLighthouseAuditMode) return;

    // This effect now robustly handles role checks after loading is complete.
    if (!loading) {
      if (!user) {
        // If no user is found after loading, redirect to landing.
        router.replace('/welcome');
      } else if (user.role && user.role !== 'user') {
        // If a user with a non-user role (e.g., vendor, admin) ends up here,
        // redirect them to the root to be correctly routed.
        router.replace('/');
      }
    }
  }, [user, loading, router]);
  
  // If in audit mode, render children immediately.
  if (isLighthouseAuditMode) {
    return <>{children}</>;
  }

  // Show a loading spinner while auth state is being confirmed,
  // or if the user is not a 'user' and is being redirected.
  if (loading || !user || user.role !== 'user') {
    return (
      <div className="flex h-[calc(100vh-150px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only render children if the user is authenticated and has the correct role.
  return <>{children}</>;
}
