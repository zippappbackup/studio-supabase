"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Ticket } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSupabaseDoc } from "@/lib/supabase/hooks";
import { supabase } from "@/lib/supabase/client";
import type { Promotion, Vendor } from "@/lib/types";
import { format } from "date-fns";
import { PromotionActions } from "./PromotionActions";
import { PromotionEditDialog } from "./PromotionEditDialog";
import Image from "next/image";
import { PlaceholderImages } from "@/lib/placeholder-images";

function PromotionCard({ promotion, onEdit }: { promotion: Promotion, onEdit: () => void }) {
  const endDate = new Date(promotion.endAt);
  const isActive = endDate > new Date();

  return (
    <Card className="flex flex-col">
      <div className="relative h-40 w-full">
        <Image
          src={promotion.imageUrl || PlaceholderImages['promo-placeholder'].imageUrl}
          alt={promotion.title}
          fill
          className="object-cover rounded-t-lg"
          data-ai-hint={promotion.imageUrl ? "promotion deal" : PlaceholderImages['promo-placeholder'].imageHint}
        />
      </div>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{promotion.title}</CardTitle>
          <CardDescription className="text-xs pt-1">
            {isActive ? `Expires on ${format(endDate, "dd MMM yyyy")}` : `Expired on ${format(endDate, "dd MMM yyyy")}`}
          </CardDescription>
        </div>
        <PromotionActions promotion={promotion} onEdit={onEdit} />
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">{promotion.description}</p>
      </CardContent>
    </Card>
  );
}

export default function PromotionsPage() {
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | undefined>(undefined);

    const vendorId = user?.vendorId || user?.uid;

    const vendorQuery = useMemo(
        () => vendorId ? () => supabase.from('vendors').select('*').eq('vendor_id', vendorId).single() : () => null,
        [vendorId]
    );
    const { data: vendor, isLoading } = useSupabaseDoc<Vendor>(vendorQuery);
    
    const promotions = vendor?.promotions || [];

    const handleAdd = () => {
        setSelectedPromotion(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (promotion: Promotion) => {
        setSelectedPromotion(promotion);
        setIsDialogOpen(true);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
                </div>
                <Button onClick={handleAdd}>
                    Create Promotion
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Your Promotions</CardTitle>
                    <CardDescription>Create and manage special deals for your customers.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && <p>Loading promotions...</p>}
                    {!isLoading && promotions?.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Promotions Yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Click "Create Promotion" to get started.</p>
                        </div>
                    )}
                    {!isLoading && promotions && promotions.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {promotions.map(promo => (
                                <PromotionCard key={promo.id} promotion={promo} onEdit={() => handleEdit(promo)} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <PromotionEditDialog 
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                promotion={selectedPromotion}
            />
        </div>
    );
}
