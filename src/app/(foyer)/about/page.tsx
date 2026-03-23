'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="w-full space-y-2 text-center pb-16">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter">
          Our Mission: To Make Life Easier
        </h1>
        <p className="text-muted-foreground">
          Zipp was born from a simple idea: finding trusted local service providers in Singapore shouldn't be a chore. We got tired of endless searching, comparing quotes, and wondering who to trust. We knew there had to be a better way.
        </p>
        <div className="pt-4 max-w-xl mx-auto">
          <img
            src="/Images/zipp-about-page-img-1.png"
            alt="About Zipp"
            width={800}
            height={400}
            className="w-full rounded-lg"
          />
        </div>
      </section>

      <div className="space-y-2 py-4">
        <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} />
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">What We Do</h2>
        <p className="text-muted-foreground">
          We are a Singapore-based team dedicated to building the most comprehensive and reliable collection of local businesses. We do the groundwork - finding, verifying, and organizing our business partners - so you can find the help you need, right when you need it. From urgent home repairs to routine car care, Zipp connects you directly with the professionals who can get the job done. No middlemen, no hidden fees.
        </p>
      </section>

      <div className="space-y-2 py-4">
        <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} />
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Built On Our Values</h2>
        <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-3 pt-2">
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
    </div>
  );
}
