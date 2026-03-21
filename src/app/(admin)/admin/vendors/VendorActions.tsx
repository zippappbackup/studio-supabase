"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Vendor } from "@/lib/types";

export function VendorActions({ vendor }: { vendor: Vendor }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Handle both snake_case (from DB) and camelCase (from type)
    const vendorId = (vendor as any).vendor_id || vendor.id;
    const status = (vendor as any).subscription_status || vendor.subscriptionStatus || '';

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            const { data: currentVendor, error: fetchError } = await supabase
                .from('vendors')
                .select('modules_enabled')
                .eq('vendor_id', vendorId)
                .single();
            
            if (fetchError) throw fetchError;

            const existingModules = currentVendor.modules_enabled || [];
            const newModules = ["offerings", "promotions", "reviews"];
            const mergedModules = [...new Set([...existingModules, ...newModules])];

            const { error: updateError } = await supabase
                .from('vendors')
                .update({
                    subscription_status: "verified",
                    updated_at: new Date().toISOString(),
                    modules_enabled: mergedModules,
                })
                .eq('vendor_id', vendorId);
            
            if (updateError) throw updateError;

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
        try {
            const { error } = await supabase
                .from('vendors')
                .update({
                    subscription_status: "pending_verification",
                    claimed_by: null,
                    updated_at: new Date().toISOString(),
                })
                .eq('vendor_id', vendorId);
            
            if (error) throw error;

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
    if (status !== 'claimed_pending_approval') {
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
