
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
import { doc, updateDoc, arrayRemove } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Promotion } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { FirestorePermissionError } from "@/firebase/errors";

interface PromotionActionsProps {
    promotion: Promotion;
    onEdit: () => void;
}

export function PromotionActions({ promotion, onEdit }: PromotionActionsProps) {
  const db = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!db || !user) return;
    const vendorId = user.vendorId || user.uid;

    if (confirm(`Are you sure you want to delete "${promotion.title}"?`)) {
        setIsLoading(true);
        const vendorRef = doc(db, "vendors", vendorId);
        try {
            await updateDoc(vendorRef, {
                promotions: arrayRemove(promotion)
            });
            toast({ title: "Promotion Deleted", description: `"${promotion.title}" has been removed.`, variant: "success" });
        } catch(e: any) {
            toast({ title: "Error", description: `Could not delete promotion: ${e.message}`, variant: "destructive" });
            const permissionError = new FirestorePermissionError({ path: vendorRef.path, operation: 'update' });
            errorEmitter.emit('permission-error', permissionError);
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
