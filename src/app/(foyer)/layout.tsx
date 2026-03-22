'use client';

import React, { useRef, useEffect } from 'react';
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

  const mainRef = useRef<HTMLElement>(null);
  const [debugInfo, setDebugInfo] = React.useState<string>('');

  useEffect(() => {
    const update = () => {
      const el = document.createElement('div');
      el.style.paddingBottom = 'env(safe-area-inset-bottom)';
      document.body.appendChild(el);
      const safeBottom = getComputedStyle(el).paddingBottom;
      document.body.removeChild(el);
      setDebugInfo(
        `win-h:${window.innerHeight} ` +
        `doc-h:${document.documentElement.clientHeight} ` +
        `main-scroll:${mainRef.current?.scrollHeight || 0} ` +
        `main-client:${mainRef.current?.clientHeight || 0} ` +
        `safe-b:${safeBottom} ` +
        `footer-h:${document.querySelector('footer')?.clientHeight || 0}`
      );
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div className="flex flex-col h-dvh overflow-hidden w-full">

      {/* HEADER */}
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
                <a href={link.href} className={`hover:text-primary ${pathname === link.href ? "text-primary font-semibold" : ""}`}>{link.label}</a>
                {index < arr.length - 1 && (
                  <span className="text-muted-foreground/50">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* SCROLLABLE AREA */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto px-6 py-4 min-h-full">
          {children}
        </div>
        <footer className="w-full max-w-4xl mx-auto px-6 pt-2" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
          <Separator style={{ backgroundColor: "hsl(212, 71%, 85.3%)" }} className="mb-4" />
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

      {/* DEBUG OVERLAY - REMOVE AFTER FIXING */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        fontSize: '10px',
        padding: '4px 8px',
        zIndex: 9999,
        fontFamily: 'monospace',
        wordBreak: 'break-all'
      }}>
        {debugInfo}
      </div>
    </div>
  );
}
