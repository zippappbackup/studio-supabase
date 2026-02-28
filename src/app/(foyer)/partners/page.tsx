
'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DollarSign, Zap, Eye } from 'lucide-react';
import Logo from '@/components/core/Logo';
import { usePathname } from 'next/navigation';

export default function ForVendorsPage() {
  const pathname = usePathname();
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/partners", label: "Partners" },
    { href: "/signup", label: "Sign Up" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="w-full space-y-8 text-center">
      {/* Hero Section */}
      <section>
        <h1 className="text-3xl font-bold leading-tight tracking-tighter">
          Connect with More Customers
        </h1>
        <h1 className="text-3xl font-bold leading-tight tracking-tighter">
          Grow Your Business with Zipp
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground pt-8">
          Zipp is Singapore's fastest-growing platform for local services. List your business, manage your profile, and let new customers find you effortlessly.
        </p>
      </section>

      <section className="pt-0">
        <Image
          src="/Images/Zipp Partner Page img 1.png"
          alt="Happy business owner"
          width={800}
          height={400}
          className="w-full rounded-lg"
          data-ai-hint="happy business owner"
        />
      </section>

      <div>
        <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} />
      </div>

      {/* Why Join Section */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold uppercase">WHY JOIN ZIPP AS A PARTNER?</h2>
        <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-6 w-6 text-accent" />
              <h3 className="font-semibold text-base">YOUR SERVICES FOUND FAST</h3>
            </div>
            <p className="mt-2 text-muted-foreground">
              Customers searching for your services can find you in seconds. Our optimized search and category system puts your business in the spotlight.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2">
              <Eye className="h-6 w-6 text-accent" />
              <h3 className="font-semibold text-base">INCREASE YOUR VISIBILITY</h3>
            </div>
            <p className="mt-2 text-muted-foreground">
              Showcase your work with a photo gallery, collect authentic reviews, and display your business hours and contact info, all in one place.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="h-6 w-6 text-accent" />
              <h3 className="font-semibold text-base">FREE FOR EVERYONE</h3>
            </div>
            <p className="mt-2 text-muted-foreground">
              Listing your business is free. Our platform is designed to be easy to use, so you can manage your profile without any technical expertise.
            </p>
          </div>
        </div>
      </section>

      <div>
        <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} />
      </div>

      {/* How it Works Section */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold">Get Started in 3 Simple Steps</h2>
        <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-3">
        <Card>
            <CardContent className="p-4 flex items-start gap-4">
              <Image
                src="/Images/Zipp Partner Page img 2.png"
                alt="Find Your Business"
                width={72}
                height={72}
                className="w-18 h-18 rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-accent">STEP 1 - FIND YOUR BUSINESS</h3>
                <p className="mt-1 text-muted-foreground">
                  Search for your business name. We may have already created a basic listing for you from public data. If you cant find your business, no worries. You can set up a fresh business account for free.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start gap-4">
              <Image
                src="/Images/Zipp Partner Page img 3.png"
                alt="Claim & Verify"
                width={72}
                height={72}
                className="w-18 h-18 rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-accent">STEP 2 - CLAIM & VERIFY</h3>
                <p className="mt-1 text-muted-foreground">
                  Claim your listing and create a vendor account. We'll verify your ownership to ensure platform integrity.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start gap-4">
              <Image
                src="/Images/Zipp Partner Page img 4.png"
                alt="Complete Your Profile"
                width={72}
                height={72}
                className="w-18 h-18 rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-accent">STEP 3 - COMPLETE YOUR PROFILE</h3>
                <p className="mt-1 text-muted-foreground">
                  Add your logo, photos, services, and business hours to attract and inform potential customers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="text-center pt-2">
            <Button asChild size="lg" variant="default">
                <Link href="/signup?role=vendor">Create Your Free Business Account</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
