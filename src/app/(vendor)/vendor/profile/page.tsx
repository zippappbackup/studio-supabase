
"use client";

import { useState } from "react";
import { VendorProfileForm } from "./VendorProfileForm";
import { PublicViewModal } from "@/components/vendor/PublicViewModal";
import { useAuth } from "@/lib/auth";

export default function VendorProfilePage() {
    const { user } = useAuth();
    const [isPublicViewOpen, setIsPublicViewOpen] = useState(false);
    
    // Use vendorId from the user object if available (for claimed vendors), otherwise fallback to UID for new vendors
    const publicVendorId = user?.vendorId || user?.uid;

    return (
        <>
            <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
                  <p className="text-muted-foreground">Manage your public presence and business details.</p>
                </div>
                <VendorProfileForm onPublicViewClick={() => setIsPublicViewOpen(true)} />
            </div>
            {publicVendorId && (
                <PublicViewModal
                    isOpen={isPublicViewOpen}
                    setIsOpen={setIsPublicViewOpen}
                    vendorId={publicVendorId}
                />
            )}
        </>
    );
}
