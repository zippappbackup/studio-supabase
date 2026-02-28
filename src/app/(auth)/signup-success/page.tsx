
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Logo from "@/components/core/Logo";
import Link from "next/link";
import { cn } from '@/lib/utils';

function SignupSuccessContent() {
  const searchParams = useSearchParams();
  const needsVerification = searchParams.get('needsVerification');

  if (needsVerification) {
    return (
      <>
        <h1 className="text-xl font-bold">Please Verify Your Email</h1>
        <p className="text-balance text-muted-foreground">
            We've sent a verification link to your email address. Please click the link to activate your account before logging in.
        </p>
        <div className="mt-4">
            <Button asChild className="w-full">
                <Link href="/login">Return to Log In</Link>
            </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold">Sign Up Successful!</h1>
      <p className="text-balance text-muted-foreground">
          Congratulations, your account has been created. You can now proceed to log in.
      </p>
      <div className="mt-4">
          <Button asChild className="w-full">
              <Link href="/login">Proceed to Log In</Link>
          </Button>
      </div>
    </>
  );
}


export default function SignupSuccessPage() {
  return (
    <div className={cn("flex min-h-screen w-full items-start justify-center p-6")}>
        <div className="mx-auto grid w-full max-w-md gap-6 z-10">
            <div className="grid gap-2 text-center">
                <div className="mx-auto mb-4">
                    <Logo />
                </div>
            </div>
            <div className="grid gap-4 text-center">
                <Suspense fallback={<div>Loading...</div>}>
                  <SignupSuccessContent />
                </Suspense>
            </div>
        </div>
    </div>
  );
}
