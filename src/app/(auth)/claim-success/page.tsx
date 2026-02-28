
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Logo from "@/components/core/Logo";
import Link from "next/link";
import { cn } from '@/lib/utils';

function ClaimSuccessContent() {
  const searchParams = useSearchParams();
  const needsVerification = searchParams.get('needsVerification') === 'true';

  if (needsVerification) {
    return (
      <>
        <h1 className="text-xl font-bold">Please Verify Your Email</h1>
        <p className="text-balance text-muted-foreground">
            Your business claim is pending. We've sent a verification link to your email. Please click it to finalize your claim and activate your account.
        </p>
        <div className="mt-4">
            <Button asChild className="w-full">
                <Link href="/login">Return to Login</Link>
            </Button>
        </div>
      </>
    );
  }

  // This is now the default success message for the manual claim flow.
  return (
    <>
      <h1 className="text-xl font-bold">Claim Submitted for Review</h1>
      <p className="text-balance text-muted-foreground">
          Thank you! Your claim has been submitted and is pending admin approval. You will be notified once your business profile is active.
      </p>
      <div className="mt-4">
          <Button asChild className="w-full">
              <Link href="/login">Return to Login</Link>
          </Button>
      </div>
    </>
  );
}


export default function ClaimSuccessPage() {
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
                  <ClaimSuccessContent />
                </Suspense>
            </div>
        </div>
    </div>
  );
}
