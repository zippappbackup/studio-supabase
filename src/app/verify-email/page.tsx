
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
import { isSignInWithEmailLink, signInWithEmailLink, getAuth } from 'firebase/auth';
import { useFirestore, initializeFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  );
  const [message, setMessage] = useState('Verifying your email...');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      
      const auth = getAuth(initializeFirebase().firebaseApp);
      const link = window.location.href;
      
      // Extract vendorId and source from the link
      const url = new URL(link);
      const vid = url.searchParams.get('vendorId');
      const src = url.searchParams.get('source');
      setVendorId(vid);
      setSource(src);

      if (!isSignInWithEmailLink(auth, link)) {
        setStatus('error');
        setMessage('This is not a valid email verification link.');
        return;
      }

      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }

      if (!email) {
        setStatus('error');
        setMessage('Email address is required to complete verification. Please return to the claim page and try again.');
        return;
      }
      
      try {
        const userCredential = await signInWithEmailLink(auth, email, link);
        window.localStorage.removeItem('emailForSignIn');
        
        setStatus('success');
        setMessage('Your email has been successfully verified. Redirecting you to the final step...');

        // Append the source to the destination URL
        const destinationUrl = `/claim-business/${vid}?step=signup&source=${src}`;
        router.replace(destinationUrl);

      } catch (error: any) {
        setStatus('error');
        if (error.code === 'auth/invalid-action-code') {
          setMessage(
            'This verification link has expired, is invalid, or has already been used. Please request a new one.'
          );
        } else {
            setMessage(`An error occurred: ${error.message}. Please try generating a new link.`);
        }
      }
    };

    verify();
  }, [router]);

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
          {status === 'success' && 'Redirecting...'}
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
            <Button className="w-full" onClick={() => router.replace(vendorId ? `/claim-business/${vendorId}` : '/home')}>
                {status === 'success' ? 'Continue to Final Step' : 'Return to Claim Page'}
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
