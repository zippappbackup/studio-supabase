import { VendorProfileClientPage } from "./VendorProfileClientPage";
import { VendorProfileErrorBoundary } from "./VendorProfileErrorBoundary";
import { getDoc, doc } from "firebase/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import type { Metadata } from "next";
import type { Vendor } from "@/lib/types";

// This function generates dynamic metadata for each vendor page.
export async function generateMetadata({ params }: { params: { vendorId: string } }): Promise<Metadata> {
  const { vendorId } = params;
  
  try {
    // We must use the admin SDK here because this runs on the server during the build process.
    const db = getAdminApp().firestore();
    const vendorRef = doc(db, "vendors", vendorId);
    const vendorSnap = await getDoc(vendorRef);

    if (vendorSnap.exists()) {
      const vendor = vendorSnap.data() as Vendor;
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
