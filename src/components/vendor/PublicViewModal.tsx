"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VendorProfileClientPage } from "@/app/(user)/vendor/[vendorId]/VendorProfileClientPage";

interface PublicViewModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  vendorId: string;
}

export function PublicViewModal({
  isOpen,
  setIsOpen,
  vendorId,
}: PublicViewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-0 flex-shrink-0">
          <DialogTitle>Public Profile Preview</DialogTitle>
          <DialogDescription>
            This is how customers will see your profile page.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          <VendorProfileClientPage vendorId={vendorId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
