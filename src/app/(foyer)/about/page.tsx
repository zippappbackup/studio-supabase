'use client';

import React from 'react';
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
    <div className="flex min-h-screen w-full flex-col items-center">
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
              {navLinks.map((link, index, arr) => (
                <React.Fragment key={link.href}>
                  <Link href={link.href} className={`hover:text-primary ${pathname === link.href ? 'text-primary font-semibold' : ''}`}>{link.label}</Link>
                  {index < arr.length - 1 && <span className="text-muted-foreground/50">·</span>}
                </React.Fragment>
              ))}
          </div>
        </div>
      <main className="w-full max-w-4xl flex-1 p-6 relative z-10">
        <div className="w-full space-y-8 text-center">
          <section className="space-y-4">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter">
              Our Mission: To Make Life Easier
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Zipp was born from a simple idea: finding trusted local service providers in Singapore shouldn't be a chore. We got tired of endless searching, comparing quotes, and wondering who to trust. We knew there had to be a better way.
            </p>
          </section>

          <section>
            <img
              src="/Images/zipp-about-page-img-1.png"
              alt="About Zipp"
              width={800}
              height={400}
              className="w-full rounded-lg"
            />
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-bold mb-4">What We Do</h2>
            <p className="mx-auto max-w-3xl text-muted-foreground">
              We are a Singapore-based team dedicated to building the most comprehensive and reliable collection of local businesses. We do the groundwork - finding, verifying, and organizing our business partners - so you can find the help you need, right when you need it. From urgent home repairs to routine car care, Zipp connects you directly with the professionals who can get the job done. No middlemen, no hidden fees.
            </p>
          </section>
          
          <div className="py-2">
            <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} />
          </div>

          <section className="space-y-8">
            <h2 className="text-2xl font-bold">Built On Our Values</h2>
            <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-3">
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <img
                    src="/Images/zipp-about-page-img-2.png"
                    alt="Trust & Transparency"
                    width={72}
                    height={72}
                    className="w-18 h-18 rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-accent uppercase">TRUST &amp; TRANSPARENCY</h3>
                    <p className="mt-1 text-muted-foreground">
                      We believe in providing clear, upfront information. All vendor ratings, reviews, and contact details are presented honestly so you can make informed decisions.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                   <img
                    src="/Images/zipp-about-page-img-3.png"
                    alt="Community First"
                    width={72}
                    height={72}
                    className="w-18 h-18 rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-accent uppercase">COMMUNITY FIRST</h3>
                    <p className="mt-1 text-muted-foreground">
                      Zipp is for everyone in Singapore. We are committed to supporting local businesses while helping our users save time and effort.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                   <img
                    src="/Images/zipp-about-page-img-4.png"
                    alt="Simplicity in Design"
                    width={72}
                    height={72}
                    className="w-18 h-18 rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-accent uppercase">SIMPLICITY IN DESIGN</h3>
                    <p className="mt-1 text-muted-foreground">
                      Finding a service should be fast and simple. Our app is designed to be intuitive and hassle-free, getting you from problem to solution in just a few taps.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
          
          <div className="py-2">
            <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} />
          </div>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Check out Zipp on our Social Media</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-center">Follow us to see what our community is saying, get the latest updates on new features, and stay connected with the Zipp team!</p>
            <div className="flex justify-center gap-6 pt-2">
              <Link href="https://www.facebook.com/share/1Ah9cGwFNy/" target="_blank" rel="noopener noreferrer" className="bg-black rounded-md p-1.5">
                <img
                  src="/icons/facebook.svg"
                  alt="Facebook"
                  width={28}
                  height={28}
                  className="h-7 w-7 filter invert"
                />
              </Link>
              <Link href="https://www.tiktok.com/@zippsg?_r=1&_t=ZS-92uxz5bHYVY" target="_blank" rel="noopener noreferrer" className="bg-black rounded-md p-1.5">
                <img
                  src="/icons/tiktok.svg"
                  alt="TikTok"
                  width={28}
                  height={28}
                  className="h-7 w-7 filter invert"
                />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <footer className="w-full max-w-4xl px-6 pb-4 pt-2 relative z-10">
        <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} className="mb-4" />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Zipp Super App. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
