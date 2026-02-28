
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/**
 * This component's sole responsibility is to perform the initial, role-based
 * redirection after the user's authentication state and role are definitively loaded.
 * It renders no UI to prevent any flash of content.
 */
export default function RootRedirector() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Wait until loading is complete and we haven't already redirected.
    if (loading || hasRedirected.current) {
      return;
    }

    // Set the flag to prevent multiple redirects.
    hasRedirected.current = true;

    // Now, with definitive data, make one correct routing decision.
    if (user && user.role) {
      const targetPath =
        user.role === 'admin'
          ? '/admin/dashboard'
          : user.role === 'vendor'
          ? '/vendor/dashboard'
          : '/home';
      router.replace(targetPath);
    } else {
      // No user or no role, go to landing.
      router.replace('/welcome');
    }
  }, [user, loading, router]);

  // This component renders nothing.
  return null;
}
