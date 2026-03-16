'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    <div className="w-full max-w-md mx-auto">
      <div className="grid gap-4 text-center">
        <Suspense fallback={<div>Loading...</div>}>
          <SignupSuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
