"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

  const publicUrl = `/vendor/${vendorId}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Public Profile Preview</DialogTitle>
          <DialogDescription>
            This is how customers will see your profile page.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 p-6 pt-2 overflow-hidden">
             <iframe
                src={publicUrl}
                title="Public Vendor Page Preview"
                className="w-full h-full border rounded-md"
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
