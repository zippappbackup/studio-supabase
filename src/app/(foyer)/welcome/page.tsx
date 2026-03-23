
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Zap, Award } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  return (
    <div className="w-full space-y-2 text-center pb-16">
      {/* Hero Section */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter">
          Singapore's Fastest Way to Find Trusted Home Services
        </h1>
        <p className="text-muted-foreground">
          Cleaning Services, Handyman Services, Car Care Services, Mobile Device Repairs and more. All pre-listed, verified and ready for you.
        </p>
        <div className="pt-4 max-w-xl mx-auto">
            <Image
                src="/Images/zipp-welcome-page-img-1.png"
                alt="Trusted home services professional"
                width={307.2}
                height={204.8}
                className="w-full rounded-lg"
                data-ai-hint="smiling professional handyman"
            />
        </div>
      </section>

      <div className="space-y-2 py-4">
        <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} />
      </div>

      {/* Feature Sections */}
      <section className="space-y-2 pt-0">
        <h2 className="text-2xl font-bold">Why Use Zipp Super App?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center justify-start p-4">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="h-6 w-6 text-accent" />
                  <h2 className="text-base font-semibold">FIND SERVICES FAST</h2>
                </div>
                <p className="mt-2 text-muted-foreground">
                  Stop scrolling, calling and comparing. Zipp pre-populates trusted
                  vendors so you can find what you need instantly.
                </p>
            </div>

            <div className="flex flex-col items-center justify-start p-4">
                <div className="flex items-center justify-center gap-2">
                  <Award className="h-6 w-6 text-accent" />
                  <h2 className="text-base font-semibold">UPFRONT & RELIABLE</h2>
                </div>
                <p className="mt-1 text-muted-foreground">
                  See vendor details upfront - ratings, reviews, operating hours and more.
                </p>
            </div>

            <div className="flex flex-col items-center justify-start p-4 md:col-span-1 col-span-1">
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="h-6 w-6 text-accent" />
                  <h2 className="text-base font-semibold">FREE FOR EVERYONE</h2>
                </div>
                <p className="mt-2 text-muted-foreground">
                  Sign up for free. No fees. Just search, compare and connect with vendors directly.
                </p>
            </div>
        </div>
        <div className="pt-8">
            <Button asChild size="lg">
                <Link href="/signup">Sign Up For A Free Account Now</Link>
            </Button>
        </div>
      </section>

      <div className="space-y-2 py-4">
        <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} />
      </div>


      {/* Steps Section */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Finding your Home Service doesn't have to be difficult.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left pt-2">
          <Card>
            <CardContent className="p-4 flex items-start gap-4">
              <Image
                src="/Images/zipp-welcome-page-img-2.png"
                alt="Search for services"
                width={72}
                height={72}
                className="w-18 h-18 rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-accent">STEP 1 - SEARCH</h3>
                <p className="mt-1 text-muted-foreground">Search for the services you require. Advanced location searches ensure you find the closest matches to you.</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start gap-4">
              <Image
                src="/Images/zipp-welcome-page-img-3.png"
                alt="Compare vendors"
                width={72}
                height={72}
                className="w-18 h-18 rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-accent">STEP 2 - COMPARE</h3>
                <p className="mt-1 text-muted-foreground">Look though the curated services. Ratings and reviews makes it easy for you to find the best option, everytime!</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start gap-4">
              <Image
                src="/Images/zipp-welcome-page-img-4.png"
                alt="Contact provider"
                width={72}
                height={72}
                className="w-18 h-18 rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-accent">STEP 3 - CONTACT</h3>
                <p className="mt-1 text-muted-foreground">Simply click on the contact info to connect with the selected service provider! No middleman and no hidden fees.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}
