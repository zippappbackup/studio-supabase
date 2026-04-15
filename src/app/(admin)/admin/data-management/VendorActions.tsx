"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { Vendor } from "@/lib/types";

interface VendorActionsProps {
  vendor: Vendor;
  onEdit: (vendor: any) => void;
  onViewSummary: (vendor: any) => void;
}

export function VendorActions({ vendor }: VendorActionsProps) {
  const handleView = () => {
    window.open(`/vendor/${vendor.id}`, '_blank');
  };

  return (
    <Button variant="outline" size="sm" onClick={handleView} className="flex items-center gap-1">
      <ExternalLink className="h-3.5 w-3.5" />
      View
    </Button>
  );
}
