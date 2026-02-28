
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
import { useFirestore, errorEmitter } from "@/firebase";
import { doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Offering, Vendor } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { FirestorePermissionError } from "@/firebase/errors";
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
  const db = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const vendorId = user?.vendorId || user?.uid;

  const handleToggleActive = async () => {
    if (!db || !vendorId) return;
    setIsLoading(true);
    const vendorRef = doc(db, "vendors", vendorId);
    try {
        // To update an item in an array, we must remove the old and add the new
        await updateDoc(vendorRef, {
            offerings: arrayRemove(offering) 
        });
        await updateDoc(vendorRef, {
            offerings: arrayUnion({ ...offering, isActive: !offering.isActive })
        });
        
        toast({
            title: "Status Updated",
            description: `${offering.name} is now ${!offering.isActive ? 'active' : 'inactive'}.`,
            variant: "success",
        });
    } catch (error: any) {
        toast({ title: "Error", description: "Could not update offering status.", variant: "destructive" });
        const permissionError = new FirestorePermissionError({ path: vendorRef.path, operation: 'update', requestResourceData: { offering } });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsConfirmOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!db || !vendorId) return;
    
    setIsLoading(true);
    const vendorRef = doc(db, "vendors", vendorId);
    
    try {
        await updateDoc(vendorRef, {
            offerings: arrayRemove(offering)
        });
        toast({ title: "Offering Deleted", description: `"${offering.name}" has been removed.`, variant: "success" });
    } catch(e: any) {
        toast({ title: "Error", description: `Could not delete offering. Check the debug log.`, variant: "destructive" });
        const permissionError = new FirestorePermissionError({ path: vendorRef.path, operation: 'update' }); // Deleting from array is an update op
        errorEmitter.emit('permission-error', permissionError);
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
