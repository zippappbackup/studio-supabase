
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreVertical, Trash2, FileText, Loader2 } from "lucide-react";
import { useFirestore } from "@/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Vendor } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VendorActionsProps {
  vendor: Vendor;
  onEdit: () => void;
  onViewSummary: () => void;
}

export function VendorActions({ vendor, onEdit, onViewSummary }: VendorActionsProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDeleteInitiated = () => {
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setIsConfirmOpen(false);
    try {
      if (!db) {
        throw new Error("Firestore not available");
      }
      const docRef = doc(db, "vendors", vendor.id);
      
      await deleteDoc(docRef);

      toast({ title: "Vendor Deleted", description: `"${vendor.name}" has been removed.`, variant: "destructive" });
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to delete vendor: ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
            <span className="sr-only">Open menu</span>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreVertical className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onViewSummary}>
            <FileText className="mr-2 h-4 w-4" />
            Summary
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteInitiated}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vendor "{vendor.name}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
