"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Promotion } from "@/lib/types";
import { useAuth } from "@/lib/auth";

interface PromotionActionsProps {
    promotion: Promotion;
    onEdit: () => void;
}

export function PromotionActions({ promotion, onEdit }: PromotionActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    const vendorId = user.vendorId || user.uid;

    if (confirm(`Are you sure you want to delete "${promotion.title}"?`)) {
        setIsLoading(true);
        
        try {
            // Fetch current vendor
            const { data: vendor, error: fetchError } = await supabase
                .from('vendors')
                .select('promotions')
                .eq('vendor_id', vendorId)
                .single();
            
            if (fetchError) throw fetchError;
            
            // Remove the promotion from the array
            const updatedPromotions = (vendor.promotions || []).filter((p: Promotion) => p.id !== promotion.id);
            
            // Save back to database
            const { error: updateError } = await supabase
                .from('vendors')
                .update({ promotions: updatedPromotions })
                .eq('vendor_id', vendorId);
            
            if (updateError) throw updateError;
            
            toast({ title: "Promotion Deleted", description: `"${promotion.title}" has been removed.`, variant: "success" });
        } catch(error: any) {
            toast({ title: "Error", description: error.message || "Could not delete promotion.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                <span className="sr-only">Open menu</span>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} disabled={isLoading}>
                Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} disabled={isLoading}>
                Delete
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
