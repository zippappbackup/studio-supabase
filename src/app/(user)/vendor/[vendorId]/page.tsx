import { VendorProfileClientPage } from "./VendorProfileClientPage";
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { VendorProfileErrorBoundary } from "./VendorProfileErrorBoundary";
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from "next";
import type { Vendor } from "@/lib/types";

// This function generates dynamic metadata for each vendor page.
export async function generateMetadata({ params }: { params: { vendorId: string } }): Promise<Metadata> {
  const { vendorId } = params;
  
  try {
    // Create a server-side Supabase client for metadata generation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('vendor_id', vendorId)
      .single();

    if (error) throw error;

    if (vendor) {
      const title = `${vendor.name} - Zipp Super App`;
      const description = vendor.description 
        ? vendor.description.substring(0, 160) 
        : `Find the best services from ${vendor.name} on Zipp.`;

      return {
        title: title,
        description: description,
      };
    }
  } catch (error) {
    console.error("Error generating metadata for vendor:", error);
  }

  // Fallback metadata if the vendor is not found
  return {
    title: "Vendor Not Found - Zipp Super App",
    description: "The requested vendor could not be found.",
  };
}


// This is the server component wrapper for the vendor profile page.
export default async function VendorProfileServerPage({ params }: { params: { vendorId: string } }) {
    const { vendorId } = params;

    if (!vendorId) {
        return null;
    }
    
    return (
        <VendorProfileErrorBoundary>
            <VendorProfileClientPage vendorId={vendorId} />
        </VendorProfileErrorBoundary>
    );
}
