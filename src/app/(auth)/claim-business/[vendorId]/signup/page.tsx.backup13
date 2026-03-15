'use client';

import { AuthFormWrapper } from "@/components/auth/AuthFormWrapper";
import { supabase } from "@/lib/supabase/client";
import { notFound, useParams } from "next/navigation";
import type { Vendor } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

// This is the dedicated client component for the vendor signup form.
// It now fetches the vendor data only once to prevent re-rendering on auth changes.
function ClaimBusinessSignupClientPage() {
  const params = useParams();
  const vendorId = params.vendorId as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch the vendor data only once when the component mounts.
    // This prevents the component from re-rendering when the auth state changes during signup.
    const fetchVendorData = async () => {
        if (!vendorId) {
            setIsLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('vendors')
                .select('*')
                .eq('vendor_id', vendorId)
                .single();
            
            if (error) throw error;
            
            if (data) {
                setVendor({ id: data.vendor_id, ...data } as Vendor);
            } else {
                setVendor(null); // Vendor not found
            }
        } catch (error) {
            console.error("Error fetching vendor data:", error);
            setVendor(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchVendorData();
  }, [vendorId]); // This effect runs only when vendorId changes.

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

  if (!vendor) {
    notFound();
    return null;
  }
  
  return (
    <div className="w-full">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">Complete Your Vendor Profile</h1>
          <p className="text-balance text-muted-foreground text-xs">
            You are claiming: <span className="font-semibold">{vendor.name}</span>
          </p>
        </div>
        <AuthFormWrapper type="signup" vendorToClaim={vendor} />
    </div>
  )
}

// The page itself just renders the client component.
export default function VendorSignupPage() {
    return <ClaimBusinessSignupClientPage />;
}
