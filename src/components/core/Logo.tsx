'use client';

import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/welcome" className="flex items-center">
        <img src="/icons/Header Logo.png" alt="ZiPP Logo" width={90} height={36} className="h-9 w-auto"/>
        <span className="text-xl font-bold tracking-tight text-foreground">ZiPP</span>
    </Link>
  );
}
