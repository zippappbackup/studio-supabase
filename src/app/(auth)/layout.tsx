"use client";

import React from 'react';
import "@/app/globals.css";
import Logo from "@/components/core/Logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navLinks = [
    { href: "/welcome", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/partners", label: "Partners" },
    { href: "/signup", label: "Sign Up" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="flex flex-col h-dvh overflow-hidden w-full">

      {/* HEADER — sticky, transparent, never scrolls away */}
      <header className="sticky top-0 z-50 bg-transparent flex-shrink-0">
        <div className="w-full max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-4">
            <Button asChild size="sm">
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </div>
        <div className="w-full max-w-4xl mx-auto px-6 pb-2">
          <div className="flex justify-center items-center gap-4 sm:gap-6 text-sm text-accent flex-wrap">
            {navLinks.map((link, index, arr) => (
              <React.Fragment key={link.href}>
                <Link
                  href={link.href}
                  className={`hover:text-primary ${pathname === link.href ? 'text-primary font-semibold' : ''}`}
                >
                  {link.label}
                </Link>
                {index < arr.length - 1 && (
                  <span className="text-muted-foreground/50">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* SCROLLABLE AREA — only this scrolls, stops at last element */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto px-6 py-4">
          {children}
        </div>
        <footer className="w-full max-w-4xl mx-auto px-6 pb-6 pt-2">
          <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} className="mb-4" />
          <div className="flex justify-center gap-6 pb-3">
            <a href="https://www.facebook.com/share/1Ah9cGwFNy/" target="_blank" rel="noopener noreferrer" className="bg-black rounded-md p-1.5">
              <img src="/icons/facebook.svg" alt="Facebook" width={28} height={28} className="h-7 w-7 filter invert" />
            </a>
            <a href="https://www.tiktok.com/@zippsg?_r=1&_t=ZS-92uxz5bHYVY" target="_blank" rel="noopener noreferrer" className="bg-black rounded-md p-1.5">
              <img src="/icons/tiktok.svg" alt="TikTok" width={28} height={28} className="h-7 w-7 filter invert" />
            </a>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Zipp Super App. All Rights Reserved.
          </p>
        </footer>
      </main>

    </div>
  );
}
