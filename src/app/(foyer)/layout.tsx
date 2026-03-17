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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

      {/* FIXED HEADER - transparent, stays at top */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <Button asChild size="sm">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '4px 24px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
            {navLinks.map((link, index, arr) => (
              <React.Fragment key={link.href}>
                <Link
                  href={link.href}
                  style={{ color: pathname === link.href ? 'hsl(212, 71%, 73%)' : undefined, fontWeight: pathname === link.href ? 600 : undefined }}
                >
                  {link.label}
                </Link>
                {index < arr.length - 1 && (
                  <span style={{ opacity: 0.4 }}>·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* SPACER - exact height of the fixed header so content starts below it */}
      <div style={{ height: '80px', flexShrink: 0 }} />

      {/* PAGE CONTENT */}
      <main style={{ width: '100%', maxWidth: '56rem', margin: '0 auto', padding: '24px' }}>
        {children}
      </main>

      {/* FOOTER */}
      <footer style={{ width: '100%', maxWidth: '56rem', margin: '0 auto', padding: '8px 24px 16px' }}>
        <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)', marginBottom: '16px' }} />
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'hsl(211, 30%, 50%)' }}>
          © {new Date().getFullYear()} Zipp Super App. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
}
