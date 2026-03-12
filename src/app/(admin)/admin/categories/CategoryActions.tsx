"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@/lib/types";
import { CategoryEditDialog } from "./CategoryEditDialog";

export function CategoryActions({ category, logMessage }: { category: Category, logMessage: (message: string) => void }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      logMessage(`Attempting to delete category: "${category.name}" (ID: ${category.id})`);
      setIsDeleting(true);
      
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', category.id);
        
        if (error) throw error;
        
        const successMsg = `Category "${category.name}" has been successfully removed.`;
        toast({ title: "Category Deleted", description: successMsg, variant: "success" });
        logMessage(`Success: ${successMsg}`);

      } catch (error: any) {
        const errorMessage = error.message.includes("permission") || error.message.includes("denied")
          ? "Permission Denied. You must be an admin to delete categories."
          : error.message || "An unknown error occurred.";
          
        toast({ title: "Deletion Failed", description: errorMessage, variant: "destructive" });
        logMessage(`Error deleting category: ${errorMessage}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
            <span className="sr-only">Open menu</span>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} disabled={isDeleting}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CategoryEditDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        category={category}
        logMessage={logMessage}
      />
    </>
  );
}
