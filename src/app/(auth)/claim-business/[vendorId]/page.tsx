'use client';

import { useState, useEffect } from 'react';
import type { Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building, Mail, MapPin, Phone, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';

export default function ClaimBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params.vendorId as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!vendorId) return;

    supabase
      .from('vendors')
      .select('*')
      .eq('vendor_id', vendorId)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setVendor({ id: data.vendor_id, ...data } as Vendor);
        } else {
          setNotFound(true);
        }
        setIsLoading(false);
      });
  }, [vendorId]);

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <p className="text-muted-foreground">Business not found.</p>
        <Button asChild className="mt-4"><Link href="/signup">Go back</Link></Button>
      </div>
    );
  }

  const vendorStatus = (vendor as any).subscription_status || vendor.subscriptionStatus;
  if (vendorStatus !== 'pending_verification') {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="items-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <CardTitle className="pt-4">Business Not Available for Claim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">This business profile has already been claimed or is not currently available.</p>
            <Button asChild><Link href="/welcome">Return to Homepage</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-4 max-w-md mx-auto">
      <div className="grid gap-2 text-center">
        <h1 className="text-xl font-bold">Is this your business?</h1>
        <p className="text-balance text-muted-foreground">
          Review the details below. If this is your business, proceed to claim it and create your account.
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
        {(vendor as any).phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{(vendor as any).phone}</p>
          </div>
        )}
        {(vendor as any).email && (
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{(vendor as any).email}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col items-stretch gap-4 pt-4">
        <Button onClick={() => router.push(`/claim-business/${vendorId}/signup`)}>
          Yes, this is my business
        </Button>
        <Button variant="link" asChild className="text-accent">
          <Link href="/signup">Not your business? Create a new listing</Link>
        </Button>
      </div>
    </div>
  );
}
