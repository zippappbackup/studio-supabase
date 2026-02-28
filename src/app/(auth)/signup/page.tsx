
'use client';

import React from 'react';
import { AuthFormWrapper } from "@/components/auth/AuthFormWrapper";
import Logo from "@/components/core/Logo";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from 'next/navigation';

export default function SignupPage() {
  const pathname = usePathname();
  const navLinks = [
    { href: "/welcome", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/partners", label: "Partners" },
    { href: "/signup", label: "Sign Up" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center"
    >
      <header className="w-full max-w-5xl px-4 py-2 relative z-10 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-4">
          <Button asChild size="sm">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </header>
      <div className="w-full max-w-4xl px-6 pb-4 pt-2 relative z-10">
        <div className="flex justify-center items-center gap-4 sm:gap-6 text-sm text-accent flex-wrap">
            {navLinks.filter(link => link.href !== pathname).map((link, index, arr) => (
              <React.Fragment key={link.href}>
                <Link href={link.href} className="hover:text-primary">{link.label}</Link>
                {index < arr.length - 1 && <span className="text-muted-foreground/50">·</span>}
              </React.Fragment>
            ))}
        </div>
      </div>
      <main className="w-full max-w-lg flex-1 p-6 z-10">
        <div className="grid gap-2 text-center">
          <h1 className="text-xl font-bold">Create Your Account Now</h1>
          <p className="text-balance text-muted-foreground text-xs">
            Its Free. Key in your information below to get started.
          </p>
        </div>
        <div className="mt-6">
          <AuthFormWrapper type="signup" />
        </div>
      </main>
       <footer className="w-full max-w-4xl px-6 pb-4 pt-8 relative z-10 mt-auto">
        <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} className="mb-4" />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Zipp Super App. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
