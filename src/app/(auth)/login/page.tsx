"use client";

import { AuthFormWrapper } from "@/components/auth/AuthFormWrapper";

export default function LoginPage() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-6 z-10">
      <AuthFormWrapper type="login" />
    </div>
  );
}
