
"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { MoreVertical, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Vendor } from "@/lib/types";

export function VendorActions({ vendor }: { vendor: Vendor }) {
    const db = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleApprove = async () => {
        setIsLoading(true);
        const vendorRef = doc(db, "vendors", vendor.id);
        try {
            // Ensure both offerings and promotions are enabled upon approval for consistency
            await updateDoc(vendorRef, {
                subscriptionStatus: "verified",
                updatedAt: serverTimestamp(),
                modulesEnabled: arrayUnion("offerings", "promotions", "reviews"), // Add default modules
            });
            toast({
                title: "Vendor Approved",
                description: `"${vendor.name}" is now a verified vendor.`,
                variant: "success",
            });
        } catch (error) {
            console.error("Error approving vendor:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Error Approving Vendor",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        setIsLoading(true);
        const vendorRef = doc(db, "vendors", vendor.id);
        try {
             await updateDoc(vendorRef, {
                subscriptionStatus: "pending_verification", // Revert status
                claimedBy: null, // Clear the claim
                updatedAt: serverTimestamp(),
            });
            toast({
                title: "Claim Rejected",
                description: `The claim for "${vendor.name}" has been rejected.`,
            });
        } catch (error) {
             console.error("Error rejecting vendor:", error);
             const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Error Rejecting Claim",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Only show actions if the status is 'claimed_pending_approval'
    if (vendor.subscriptionStatus !== 'claimed_pending_approval') {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                    <span className="sr-only">Open menu</span>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleApprove} disabled={isLoading}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Claim
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReject} disabled={isLoading}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Claim
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
