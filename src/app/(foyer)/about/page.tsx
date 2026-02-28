
'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/core/Logo';
import { usePathname } from 'next/navigation';

export default function AboutPage() {
  const pathname = usePathname();
  const navLinks = [
    { href: "/welcome", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/partners", label: "Partners" },
    { href: "/signup", label: "Sign Up" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="w-full space-y-8 text-center">
      
    </div>
  );
}
