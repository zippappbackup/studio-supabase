'use client';

import React from 'react';
import "@/app/globals.css";
import Logo from "@/components/core/Logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";

export default function FoyerLayout({
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
    <div className="flex min-h-screen w-full flex-col items-center">
        {/* STICKY HEADER — stays at top */}
        <header className="sticky top-0 z-50 w-full bg-[var(--fog-base)] flex-shrink-0">
            <div className="w-full max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
                <Logo />
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button asChild size="sm">
                    <Link href="/login">Log In</Link>
                  </Button>
                </div>
            </div>
            <div className="w-full max-w-4xl mx-auto px-6 pb-4 pt-2">
              <div className="flex justify-center items-center gap-4 sm:gap-6 text-sm text-accent flex-wrap">
                  {navLinks.map((link, index, arr) => (
                    <React.Fragment key={link.href}>
                      <Link href={link.href} className={`hover:text-primary ${pathname === link.href ? 'text-primary font-semibold' : ''}`}>{link.label}</Link>
                      {index < arr.length - 1 && <span className="text-muted-foreground/50">·</span>}
                    </React.Fragment>
                  ))}
              </div>
            </div>
        </header>
        
        {/* CONTENT — scrolls naturally, no over-scroll */}
        <main className="w-full max-w-4xl flex-1 p-6 relative z-10">
            <div className="w-full space-y-2 text-center">
                {children}
            </div>
        </main>
        
        {/* FOOTER */}
        <footer className="w-full max-w-4xl px-6 pb-4 pt-2 relative z-10">
            <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} className="mb-4" />
            <p className="mt-4 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Zipp Super App. All Rights Reserved.
            </p>
        </footer>
    </div>
  );
}
