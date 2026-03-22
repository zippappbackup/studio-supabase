"use client";

import { AuthFormWrapper } from "@/components/auth/AuthFormWrapper";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-auto">
      <AuthFormWrapper type="login" />
    </div>
  );
}
