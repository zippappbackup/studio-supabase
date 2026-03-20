import { VendorProfileClientPage } from "./VendorProfileClientPage";
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { VendorProfileErrorBoundary } from "./VendorProfileErrorBoundary";

// This is the server component wrapper for the vendor profile page.
export default async function VendorProfileServerPage({ params }: { params: Promise<{ vendorId: string }> }) {
    const { vendorId } = await params;

    if (!vendorId) {
        return null;
    }
    
    return (
        <VendorProfileErrorBoundary>
            <VendorProfileClientPage vendorId={vendorId} />
        </VendorProfileErrorBoundary>
    );
}
