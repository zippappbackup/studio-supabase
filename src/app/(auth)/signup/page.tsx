'use client';

import React from 'react';
import { AuthFormWrapper } from "@/components/auth/AuthFormWrapper";

export default function SignupPage() {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="grid gap-2 text-center mb-6">
        <h1 className="text-xl font-bold">Create Your Account Now</h1>
        <p className="text-balance text-muted-foreground text-xs">
          Its Free. Key in your information below to get started.
        </p>
      </div>
      <AuthFormWrapper type="signup" />
    </div>
  );
}
