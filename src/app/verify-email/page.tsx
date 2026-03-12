'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  );
  const [message, setMessage] = useState('Verifying your email...');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      // Extract vendorId and source from URL params
      const vid = searchParams.get('vendorId');
      const src = searchParams.get('source');
      const type = searchParams.get('type');
      
      setVendorId(vid);
      setSource(src);

      // Check for Supabase auth error
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'An error occurred during verification. Please try again.');
        return;
      }

      // Check if this is a confirmation callback from Supabase
      if (type === 'signup' || type === 'email_change') {
        // Supabase has already verified the email at this point
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setStatus('success');
          setMessage('Your email has been successfully verified. Redirecting you to the final step...');
          
          // Wait a moment then redirect
          setTimeout(() => {
            if (vid && src) {
              router.replace(`/claim-business/${vid}?step=signup&source=${src}`);
            } else {
              router.replace('/profile');
            }
          }, 1500);
        } else {
          setStatus('error');
          setMessage('Session not found. Please try logging in again.');
        }
      } else {
        // If we got here without proper params, it might be an old link
        setStatus('error');
        setMessage('This verification link is invalid or has expired. Please request a new one.');
      }
    };

    verify();
  }, [router, searchParams]);

  const Icon = {
    verifying: Loader2,
    success: CheckCircle,
    error: AlertTriangle,
  }[status];

  const iconColor = {
    verifying: 'text-muted-foreground',
    success: 'text-green-500',
    error: 'text-destructive',
  }[status];
  
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto w-fit rounded-full p-4">
          <Icon
            className={`h-12 w-12 ${iconColor} ${
              status === 'verifying' ? 'animate-spin' : ''
            }`}
          />
        </div>
        <CardTitle className="pt-4 text-xl">
          {status === 'verifying' && 'Verifying Your Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
       {status === 'success' && (
        <CardContent>
            <p className="text-sm text-muted-foreground">If you are not redirected automatically, please click the button below.</p>
        </CardContent>
      )}
      {status !== 'verifying' && (
        <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => {
                if (status === 'success' && vendorId) {
                  router.replace(`/claim-business/${vendorId}?step=signup&source=${source}`);
                } else if (status === 'success') {
                  router.replace('/profile');
                } else {
                  router.replace(vendorId ? `/claim-business/${vendorId}` : '/login');
                }
              }}
            >
                {status === 'success' ? 'Continue' : 'Return to Login'}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
     <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
        <Suspense
            fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading verification page...</p>
                </div>
            </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    </div>
  );
}
