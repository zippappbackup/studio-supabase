'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: "/welcome", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/partners", label: "Partners" },
  { href: "/signup", label: "Sign Up" },
  { href: "/contact", label: "Contact" },
];

export function AuthNav() {
  const pathname = usePathname();
  return (
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
  );
}
