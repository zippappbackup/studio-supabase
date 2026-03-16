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
    <div className="flex flex-col w-full h-screen overflow-hidden items-center">
        {/* HEADER — fixed height, doesn't scroll */}
        <header className="w-full flex-shrink-0">
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
        
        {/* SCROLLABLE CONTENT — only this scrolls */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="w-full space-y-2 text-center">
                    {children}
                </div>
            </div>
            
            {/* FOOTER — inside scrollable area */}
            <footer className="w-full max-w-4xl mx-auto px-6 pb-4 pt-2">
                <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} className="mb-4" />
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  © {new Date().getFullYear()} Zipp Super App. All Rights Reserved.
                </p>
            </footer>
        </main>
    </div>
  );
}
