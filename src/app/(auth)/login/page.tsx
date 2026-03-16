"use client";

import { AuthFormWrapper } from "@/components/auth/AuthFormWrapper";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid gap-2 text-center">
        <h1 className="text-xl font-bold">Welcome Back</h1>
        <p className="text-balance text-muted-foreground text-xs">
          Enter your credentials to access your account
        </p>
      </div>
      <AuthFormWrapper type="login" />
    </div>
  );
}
