
"use client";

import { AuthFormWrapper } from "@/components/auth/AuthFormWrapper";
import Logo from "@/components/core/Logo";
import { cn } from "@/lib/utils";

export default function LoginPage() {

  return (
    <div
      className={cn("flex min-h-screen w-full items-start justify-center p-6")}
    >
      <div className="mx-auto grid w-full max-w-md gap-6 z-10">
        <div className="grid gap-2 text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
        </div>
        <AuthFormWrapper type="login" />
      </div>
      
    </div>
  );
}
