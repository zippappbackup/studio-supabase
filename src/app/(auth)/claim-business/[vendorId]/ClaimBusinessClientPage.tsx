'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Building,
  Mail,
  MapPin,
  Phone,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { useRouter, notFound } from 'next/navigation';
import Logo from '@/components/core/Logo';

export default function ClaimBusinessClientPage({ vendorId }: { vendorId: string }) {
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoadingVendor, setIsLoadingVendor] = useState(true);

  const { loading: authLoading } = useAuth();


  useEffect(() => {
    async function fetchVendorData() {
        if (!vendorId) {
            return;
        };
        setIsLoadingVendor(true);
        try {
            const { data, error } = await supabase
                .from('vendors')
                .select('*')
                .eq('vendor_id', vendorId)
                .single();
            
            if (data && !error) {
                setVendor({ id: data.vendor_id, ...data } as Vendor);
            } else {
                setVendor(null);
            }
        } catch (error) {
            console.error("Error fetching vendor data:", error);
            setVendor(null);
        } finally {
            setIsLoadingVendor(false);
        }
    }
    fetchVendorData();
  }, [vendorId]);

  // When user confirms this is their business, navigate to the dedicated signup page.
  const handleProceedToClaim = () => {
    router.push(`/claim-business/${vendorId}/signup`);
  };

  const isLoading = isLoadingVendor || authLoading;

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
             <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Loading business details...</p>
            </div>
        </div>
    );
  }

  if (!vendor) {
    notFound();
    return null;
  }

  if (vendor.subscriptionStatus !== 'pending_verification') {
      return (
        <div className="mx-auto grid w-full max-w-md gap-6 px-4">
              <Card>
                  <CardHeader className="items-center">
                      <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
                      <CardTitle className="pt-4">Business Not Available for Claim</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-center">
                      <p className="text-muted-foreground">This business profile has already been claimed or is not currently available for claiming.</p>
                      <p className="text-sm">If you believe this is a mistake, please contact our support team.</p>
                      <Button asChild>
                          <Link href="/home">Return to Homepage</Link>
                      </Button>
                  </CardContent>
              </Card>
        </div>
      );
  }

  return (
    <div className="grid w-full gap-4">
      <div className="grid gap-2 text-center">
        <h1 className="text-xl font-bold">Is this your business?</h1>
        <p className="text-balance text-muted-foreground">
          Review the details below. If this is your business, you can
          proceed to claim it and create your account.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Building className="h-5 w-5 text-muted-foreground" />
          <p className="font-semibold">{vendor.name}</p>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
          <p className="text-sm text-muted-foreground">{vendor.address}</p>
        </div>
        {vendor.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{vendor.phone}</p>
          </div>
        )}
        {vendor.email && (
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{vendor.email}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col items-stretch gap-4 pt-4">
        <Button onClick={handleProceedToClaim}>
          Yes, this is my business
        </Button>
        <Button variant="link" asChild className="text-accent">
          <Link href="/signup">Not your business? Create a new listing</Link>
        </Button>
      </div>
    </div>
  );
}
