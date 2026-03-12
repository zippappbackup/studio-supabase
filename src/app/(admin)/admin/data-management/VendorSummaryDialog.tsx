"use client";

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Vendor } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSupabaseDoc } from '@/lib/supabase/hooks';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface VendorSummaryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  vendorId?: string;
}

const getSafeDate = (dateInput: any): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) return date;
    return null;
};

const SummaryItem = ({ label, value }: { label: string; value: any }) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        return null;
    }

    const renderValue = () => {
        if (typeof value === 'boolean') {
            return <span className="text-sm">{value ? 'Yes' : 'No'}</span>;
        }
        if (value instanceof Date) {
             return format(value, "dd/MM/yyyy, HH:mm:ss");
        }
        const safeDate = getSafeDate(value);
        if (safeDate && !isNaN(safeDate.getTime())) {
             return format(safeDate, "dd/MM/yyyy, HH:mm:ss");
        }
        
        if (Array.isArray(value)) {
            return (
                <div className="space-y-2">
                    {value.map((item, index) => (
                        <div key={index} className="p-2 border rounded-md bg-background/50 text-xs break-all">
                             {typeof item === 'object' ? 
                                <pre className="whitespace-pre-wrap font-mono"><code>{JSON.stringify(item, null, 2)}</code></pre> : 
                                item.toString()
                             }
                        </div>
                    ))}
                </div>
            )
        }
        if (typeof value === 'object') {
            return <pre className="text-xs p-2 bg-background/50 rounded-md whitespace-pre-wrap break-all font-mono"><code>{JSON.stringify(value, null, 2)}</code></pre>;
        }
        return <span className="break-all">{value.toString()}</span>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 py-2.5 text-sm">
            <dt className="font-semibold text-muted-foreground md:col-span-1">{label}</dt>
            <dd className="md:col-span-2">{renderValue()}</dd>
        </div>
    );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-1">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <dl className="divide-y">{children}</dl>
        <Separator className="my-4"/>
    </div>
);

export function VendorSummaryDialog({ isOpen, setIsOpen, vendorId }: VendorSummaryDialogProps) {
  const vendorQuery = useMemo(
    () => vendorId ? () => supabase.from('vendors').select('*').eq('vendor_id', vendorId).single() : () => null,
    [vendorId]
  );
  const { data: vendor, isLoading } = useSupabaseDoc<Vendor>(vendorQuery);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vendor Data Summary: {vendor?.name || 'Loading...'}</DialogTitle>
          <DialogDescription>A read-only representation of the vendor's live data from the database.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6 bg-background rounded-md border">
            <div className="p-4 space-y-6">
                 {isLoading && (
                    <div className="flex items-center justify-center h-full pt-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                 )}
                 {!isLoading && vendor ? (
                    <>
                        <Section title="Core Information">
                            <SummaryItem label="ID" value={vendor.id} />
                            <SummaryItem label="Name" value={vendor.name} />
                            <SummaryItem label="Normalized Name" value={vendor.normalizedName} />
                            <SummaryItem label="Category ID" value={vendor.categoryId} />
                        </Section>
                        <Section title="Location & Contact">
                            <SummaryItem label="Address" value={vendor.address} />
                            <SummaryItem label="Region" value={vendor.region} />
                            <SummaryItem label="Latitude" value={vendor.lat} />
                            <SummaryItem label="Longitude" value={vendor.lng} />
                            <SummaryItem label="Phone" value={vendor.phone} />
                            <SummaryItem label="Email" value={vendor.email} />
                            <SummaryItem label="Website" value={vendor.website} />
                        </Section>
                         <Section title="Ratings & Sync">
                            <SummaryItem label="Google Place ID" value={vendor.googlePlaceId} />
                            <SummaryItem label="Google Rating" value={vendor.googleRating} />
                            <SummaryItem label="Google Reviews" value={vendor.googleReviewCount} />
                            <SummaryItem label="Zipp Rating" value={vendor.zippRating} />
                            <SummaryItem label="Zipp Reviews" value={vendor.zippReviewCount} />
                            <SummaryItem label="Google Sync Locked" value={vendor.googleSyncLocked} />
                            <SummaryItem label="Last Google Sync" value={vendor.googleLastSyncedAt} />
                        </Section>
                        <Section title="Details & Metadata">
                            <SummaryItem label="Tags" value={vendor.tags} />
                            <SummaryItem label="Google Types" value={vendor.types} />
                            <SummaryItem label="Matched Keywords" value={vendor.matchedKeywords} />
                            <SummaryItem label="Subscription" value={vendor.subscriptionStatus} />
                            <SummaryItem label="Claimed By (UID)" value={vendor.claimedBy} />
                            <SummaryItem label="Profile Views" value={vendor.profileViews} />
                            <SummaryItem label="Created At" value={vendor.createdAt} />
                            <SummaryItem label="Updated At" value={vendor.updatedAt} />
                            <SummaryItem label="Trial Started At" value={vendor.trialStartedAt} />
                        </Section>
                         <Section title="Denormalized Data">
                             <SummaryItem label="Photos" value={vendor.photos} />
                             <SummaryItem label="Offerings" value={vendor.offerings} />
                             <SummaryItem label="Promotions" value={vendor.promotions} />
                             <SummaryItem label="Reviews" value={vendor.reviews} />
                         </Section>
                    </>
                ) : (
                    !isLoading && <p className="text-center pt-20 text-muted-foreground">No vendor data available for this ID.</p>
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
