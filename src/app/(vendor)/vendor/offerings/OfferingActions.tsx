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
import type { Offering, Vendor } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface OfferingActionsProps {
    offering: Offering;
    onEdit: () => void;
}

export function OfferingActions({ offering, onEdit }: OfferingActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const vendorId = user?.vendorId || user?.uid;

  const handleToggleActive = async () => {
    if (!vendorId) return;
    setIsLoading(true);
    
    try {
        // Fetch current vendor
        const { data: vendor, error: fetchError } = await supabase
            .from('vendors')
            .select('offerings')
            .eq('vendor_id', vendorId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Update the offerings array
        const updatedOfferings = (vendor.offerings || []).map((o: Offering) =>
            o.id === offering.id ? { ...o, isActive: !o.isActive } : o
        );
        
        // Save back to database
        const { error: updateError } = await supabase
            .from('vendors')
            .update({ offerings: updatedOfferings })
            .eq('vendor_id', vendorId);
        
        if (updateError) throw updateError;
        
        toast({
            title: "Status Updated",
            description: `${offering.name} is now ${!offering.isActive ? 'active' : 'inactive'}.`,
            variant: "success",
        });
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Could not update offering status.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsConfirmOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!vendorId) return;
    
    setIsLoading(true);
    
    try {
        // Fetch current vendor
        const { data: vendor, error: fetchError } = await supabase
            .from('vendors')
            .select('offerings')
            .eq('vendor_id', vendorId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Remove the offering from the array
        const updatedOfferings = (vendor.offerings || []).filter((o: Offering) => o.id !== offering.id);
        
        // Save back to database
        const { error: updateError } = await supabase
            .from('vendors')
            .update({ offerings: updatedOfferings })
            .eq('vendor_id', vendorId);
        
        if (updateError) throw updateError;
        
        toast({ title: "Offering Deleted", description: `"${offering.name}" has been removed.`, variant: "success" });
    } catch(error: any) {
        toast({ title: "Error", description: error.message || "Could not delete offering.", variant: "destructive" });
    } finally {
        setIsLoading(false);
        setIsConfirmOpen(false);
    }
  };

  return (
    <>
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
              <DropdownMenuItem onClick={handleToggleActive} disabled={isLoading}>
                  {offering.isActive ? 'Set Inactive' : 'Set Active'}
              </DropdownMenuItem>
          </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the offering "{offering.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
