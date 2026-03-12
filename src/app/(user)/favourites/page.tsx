'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Heart, Loader2, Star, Ticket, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import type { ZippUser, Vendor, Promotion, UserCollection, RedemptionEvent, Category, GooglePhoto } from "@/lib/types";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceholderImages } from '@/lib/placeholder-images';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useAppCache } from '@/context/AppCacheProvider';
import { getLogoUrl } from '@/lib/utils';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * A robust helper to safely convert various date formats into a JS Date object.
 * Handles ISO strings, Date objects, and number (millisecond) dates.
 * Returns null if the input is invalid or cannot be parsed.
 */
const getSafeDate = (dateInput: any): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
        return dateInput;
    }
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return null;
};


function FavouriteVendorCard({ vendor, onRemove }: { vendor: Vendor; onRemove: (vendorId: string) => void; }) {
  const logoUrl = getLogoUrl(vendor);
  const rating = vendor.googleRating || vendor.zippRating;
  const reviewCount = vendor.googleReviewCount || vendor.zippReviewCount;
  const displayCategory = vendor.categoryId
    ? vendor.categoryId
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
    : '';
  const vendorKeywords = (vendor.matchedKeywords || []).filter(kw => kw && kw !== 'establishment' && kw !== 'point_of_interest');

  return (
    <Card className="flex flex-col h-full border border-muted">
      <CardHeader className="p-0">
        <Link href={`/vendor/${vendor.id}`} className="block p-4">
            <div className="flex items-start gap-4 w-full">
                <Image
                    unoptimized
                    src={logoUrl}
                    alt={`${vendor.name} logo`}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-lg object-cover force-no-border"
                    data-ai-hint={logoUrl !== PlaceholderImages['vendor-logo-placeholder'].imageUrl ? "vendor logo" : "logo placeholder"}
                />
                <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold truncate" style={{ fontSize: '1.02em' }}>{vendor.name}</p>
                        {vendor.subscriptionStatus === 'verified' && (
                            <Tooltip>
                                <TooltipTrigger>
                                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Verified Vendor</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 flex-wrap mt-1 text-xs text-muted-foreground">
                      {displayCategory && <span className="capitalize font-medium text-accent">{displayCategory}</span>}
                      {displayCategory && vendorKeywords.length > 0 && <span className="mx-1">|</span>}
                      {vendorKeywords.map((keyword, index) => (
                        <React.Fragment key={keyword}>
                          <span className="capitalize">{keyword.replace(/_/g, ' ')}</span>
                          {index < vendorKeywords.length - 1 && <span className="mx-1">&middot;</span>}
                        </React.Fragment>
                      ))}
                    </div>

                     <p className="text-xs text-foreground mt-1 truncate">{vendor.address}</p>
                </div>
                <div className="flex flex-col items-end gap-0 text-sm shrink-0">
                    {rating ? (
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold">{rating.toFixed(1)}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-gray-300" />
                        </div>
                    )}
                    {rating ? (
                        <span className="text-muted-foreground text-xs">({reviewCount})</span>
                    ) : (
                        <span className="text-muted-foreground text-xs">New</span>
                    )}
                </div>
            </div>
        </Link>
      </CardHeader>
      <CardContent className="p-0 flex-1"></CardContent>
      <CardFooter className="p-2 border-t">
        <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => onRemove(vendor.id)}
        >
            Remove from Favourites
        </Button>
      </CardFooter>
    </Card>
  );
}

function FavouritesList() {
  const { user, loading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const { vendorDataset, isVendorDataReady } = useAppCache();

  // Directly use the favourite IDs from the authenticated user object.
  const favouriteIds = user?.favourites || [];

  const favoriteVendors = useMemo(() => {
    if (!isVendorDataReady || !vendorDataset || favouriteIds.length === 0) {
      return [];
    }
    const favoriteIdSet = new Set(favouriteIds);
    return vendorDataset.filter(vendor => favoriteIdSet.has(vendor.id));
  }, [favouriteIds, vendorDataset, isVendorDataReady]);

  const handleRemove = async (vendorId: string) => {
    if (!user) return;

    try {
        // Fetch current user data
        const { data: currentUser, error: fetchError } = await supabase
            .from('users')
            .select('favourites')
            .eq('id', user.uid)
            .single();
        
        if (fetchError) throw fetchError;

        // Remove vendorId from favourites array
        const updatedFavourites = (currentUser.favourites || []).filter((id: string) => id !== vendorId);

        // Update user with new favourites array
        const { error: updateError } = await supabase
            .from('users')
            .update({ favourites: updatedFavourites })
            .eq('id', user.uid);
        
        if (updateError) throw updateError;

        toast({
            title: "Removed from Favourites",
            description: "The vendor has been removed from your list.",
        });
    } catch (error: any) {
        toast({
            title: "Error",
            description: "Could not remove from favourites. " + error.message,
            variant: "destructive"
        });
    }
  };

  const isLoading = isUserLoading || !isVendorDataReady;

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Loader2 className="mx-auto h-12 w-12 animate-spin" />
        <p className="mt-4">Loading your favourites...</p>
      </div>
    );
  }

  if (favoriteVendors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Heart className="mx-auto h-12 w-12" />
        <p className="mt-4">
          You haven't added any vendors to your favourites yet.
        </p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/search">Explore Vendors</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {favoriteVendors.map((vendor) => (
        <FavouriteVendorCard key={vendor.id} vendor={vendor} onRemove={handleRemove}/>
      ))}
    </div>
  );
}

interface PromotionCardProps {
  collection: UserCollection & { promotion: Promotion };
  onRedeem: () => void;
  onUncollect: () => void;
}

function PromotionCard({ 
    collection, 
    onRedeem, 
    onUncollect
}: PromotionCardProps) {
  const [vendorName, setVendorName] = useState<string | null>(null);
  const promotion = collection.promotion;

  useEffect(() => {
    async function fetchVendorName() {
        if (promotion.vendorId) {
            try {
                const { data, error } = await supabase
                    .from('vendors')
                    .select('name')
                    .eq('vendor_id', promotion.vendorId)
                    .single();
                
                if (error) throw error;
                if (data) {
                    setVendorName(data.name);
                }
            } catch (error) {
                console.error("Error fetching vendor name for promo card:", error);
            }
        }
    }
    fetchVendorName();
  }, [promotion.vendorId]);

  const endDate = getSafeDate(promotion.endAt);
    
  return (
    <Card className="flex flex-col overflow-hidden bg-card">
      <div className="relative h-40 w-full">
        <Image
          unoptimized
          src={promotion.imageUrl || PlaceholderImages['promo-placeholder'].imageUrl}
          alt={promotion.title}
          fill
          className="object-cover"
          data-ai-hint={promotion.imageUrl ? "promotion deal" : PlaceholderImages['promo-placeholder'].imageHint}
        />
      </div>
      <CardHeader>
        <CardTitle>{promotion.title}</CardTitle>
        <CardDescription>
          at <Link href={`/vendor/${promotion.vendorId}`} className="text-accent">{vendorName || '...'}</Link>
        </CardDescription>
        {endDate && <p className="text-xs text-muted-foreground pt-1">Expires on {format(endDate, "dd MMM yyyy")}</p>}
        <Separator className="mt-2" />
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <p className="text-sm text-muted-foreground">{promotion.description}</p>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2">
          <Button onClick={onRedeem} className="w-full">Redeem Now</Button>
          <Button onClick={onUncollect} className="w-full">
              Remove
          </Button>
      </CardFooter>
    </Card>
  );
}


function PromotionsList() {
    const { user: userData, loading: isUserLoading } = useAuth();
    const { toast } = useToast();
    
    const [collectedPromotions, setCollectedPromotions] = useState<(UserCollection & { promotion: Promotion })[]>([]);
    const [isLoadingPromos, setIsLoadingPromos] = useState(true);

    const [promotionToRedeem, setPromotionToRedeem] = useState<UserCollection & { promotion: Promotion } | null>(null);
    const [promotionToUncollect, setPromotionToUncollect] = useState<UserCollection & { promotion: Promotion } | null>(null);
    
    useEffect(() => {
        const fetchLivePromotions = async () => {
            if (!userData) {
                setIsLoadingPromos(false);
                return;
            };

            setIsLoadingPromos(true);
            const userCollectedRefs = userData.collectedPromotions || [];
            
            const promotionPromises = userCollectedRefs.map(async (collectionRef) => {
                try {
                    const { data: vendorData, error } = await supabase
                        .from('vendors')
                        .select('*')
                        .eq('vendor_id', collectionRef.vendorId)
                        .single();
                    
                    if (error) throw error;
                    
                    if (vendorData) {
                        const promotion = vendorData.promotions?.find((p: Promotion) => p.id === collectionRef.promotionId);
                        if (promotion) {
                            return { ...collectionRef, promotion };
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch vendor ${collectionRef.vendorId}`, e);
                }
                return null;
            });
            
            const resolvedPromotions = (await Promise.all(promotionPromises))
                .filter((p): p is UserCollection & { promotion: Promotion } => p !== null);
            
            setCollectedPromotions(resolvedPromotions);
            setIsLoadingPromos(false);
        };

        fetchLivePromotions();

    }, [userData]);


    const handleRedeem = (collection: UserCollection & { promotion: Promotion }) => {
        setPromotionToRedeem(collection);
    };

    const handleUncollect = (collection: UserCollection & { promotion: Promotion }) => {
        setPromotionToUncollect(collection);
    };

    const confirmRedeem = async () => {
        if (!promotionToRedeem || !userData) return;

        toast({ title: "Processing Redemption", description: "Please wait...", variant: "info" });
        
        try {
            // Fetch current user data
            const { data: currentUser, error: userFetchError } = await supabase
                .from('users')
                .select('collected_promotions')
                .eq('id', userData.uid)
                .single();
            
            if (userFetchError) throw userFetchError;

            // Fetch current vendor data
            const { data: currentVendor, error: vendorFetchError } = await supabase
                .from('vendors')
                .select('promotions')
                .eq('vendor_id', promotionToRedeem.vendorId)
                .single();
            
            if (vendorFetchError) throw vendorFetchError;

            const currentCollections = (currentUser.collected_promotions || []) as UserCollection[];
            const collectionToRemove = currentCollections.find(c => c.redemptionId === promotionToRedeem.redemptionId);

            if (!collectionToRemove) {
                console.log("Could not find promotion to redeem in user's collection.");
                return; 
            }

            // Remove from user's collected promotions
            const updatedCollections = currentCollections.filter(c => c.redemptionId !== promotionToRedeem.redemptionId);

            // Update user
            const { error: userUpdateError } = await supabase
                .from('users')
                .update({ collected_promotions: updatedCollections })
                .eq('id', userData.uid);
            
            if (userUpdateError) throw userUpdateError;
            
            // Update vendor promotion redemptions
            const newPromotions = [...(currentVendor.promotions || [])];
            const promoIndex = newPromotions.findIndex((p: Promotion) => p.id === promotionToRedeem.promotionId);

            if (promoIndex > -1) {
                const existingRedemptions = newPromotions[promoIndex].redemptions || [];
                const redemptionEventIndex = existingRedemptions.findIndex(r => r.redemptionId === promotionToRedeem.redemptionId);
                
                if (redemptionEventIndex > -1) {
                    existingRedemptions[redemptionEventIndex].status = 'redeemed';
                    existingRedemptions[redemptionEventIndex].redeemedAt = new Date();
                    newPromotions[promoIndex].redemptions = existingRedemptions;
                    
                    const { error: vendorUpdateError } = await supabase
                        .from('vendors')
                        .update({ promotions: newPromotions })
                        .eq('vendor_id', promotionToRedeem.vendorId);
                    
                    if (vendorUpdateError) throw vendorUpdateError;
                }
            }

            toast({ title: "Promotion Redeemed!", variant: "success" });
        } catch (error: any) {
            toast({ title: "Redemption Failed", description: error.message, variant: "destructive" });
        } finally {
            setPromotionToRedeem(null);
        }
    };
    
    const confirmUncollect = async () => {
        if (!promotionToUncollect || !userData) return;
        
        toast({ title: "Removing Promotion", description: "Please wait...", variant: "info" });
        try {
            // Fetch current user data
            const { data: currentUser, error: userFetchError } = await supabase
                .from('users')
                .select('collected_promotions')
                .eq('id', userData.uid)
                .single();
            
            if (userFetchError) throw userFetchError;

            // Fetch current vendor data
            const { data: currentVendor, error: vendorFetchError } = await supabase
                .from('vendors')
                .select('promotions')
                .eq('vendor_id', promotionToUncollect.vendorId)
                .single();
            
            if (vendorFetchError) throw vendorFetchError;
            
            const currentCollections = (currentUser.collected_promotions || []) as UserCollection[];
            const collectionToRemove = currentCollections.find(c => c.redemptionId === promotionToUncollect.redemptionId);

            if (!collectionToRemove) return;

            // Remove from user's collected promotions
            const updatedCollections = currentCollections.filter(c => c.redemptionId !== promotionToUncollect.redemptionId);

            // Update user
            const { error: userUpdateError } = await supabase
                .from('users')
                .update({ collected_promotions: updatedCollections })
                .eq('id', userData.uid);
            
            if (userUpdateError) throw userUpdateError;

            // Update vendor promotions
            const newPromotions = [...(currentVendor.promotions || [])];
            const promoIndex = newPromotions.findIndex((p: Promotion) => p.id === promotionToUncollect.promotionId);

            if (promoIndex > -1) {
                const existingRedemptions = newPromotions[promoIndex].redemptions || [];
                newPromotions[promoIndex].redemptions = existingRedemptions.filter(r => r.redemptionId !== promotionToUncollect.redemptionId);
                
                const { error: vendorUpdateError } = await supabase
                    .from('vendors')
                    .update({ promotions: newPromotions })
                    .eq('vendor_id', promotionToUncollect.vendorId);
                
                if (vendorUpdateError) throw vendorUpdateError;
            }

            toast({ title: "Promotion Removed", description: "This promotion has been removed from your collection.", variant: "success" });
        } catch (error: any) {
             toast({ title: "Failed to Remove", description: error.message, variant: "destructive" });
        } finally {
            setPromotionToUncollect(null);
        }
    }

    if (isLoadingPromos || isUserLoading) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                <p className="mt-4">Loading your promotions...</p>
            </div>
        );
    }

    if (collectedPromotions.length === 0) {
        return (
          <div className="text-center py-12 text-muted-foreground">
            <Ticket className="mx-auto h-12 w-12" />
            <p className="mt-4">You haven't collected any promotions yet.</p>
          </div>
        );
    }

    return (
        <>
        <div className="space-y-8">
            {collectedPromotions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collectedPromotions.map(collection => (
                        <PromotionCard
                            key={`${collection.promotionId}-${new Date(collection.collectedAt).getTime()}`}
                            collection={collection}
                            onRedeem={() => handleRedeem(collection)}
                            onUncollect={() => handleUncollect(collection)}
                        />
                    ))}
                </div>
            )}
        </div>

        <AlertDialog open={!!promotionToRedeem} onOpenChange={() => setPromotionToRedeem(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
                <AlertDialogDescription>
                You are about to redeem the promotion: <span className="font-bold">"{promotionToRedeem?.promotion.title}"</span>. This action is permanent and cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRedeem}>
                Redeem Now
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!promotionToUncollect} onOpenChange={() => setPromotionToUncollect(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Remove from Collection?</AlertDialogTitle>
                <AlertDialogDescription>
                This will remove <span className="font-bold">"{promotionToUncollect?.promotion.title}"</span> from your Zipp Hub. You can collect it again later if it's still active.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmUncollect} className="bg-destructive text-destructive-foreground">
                Yes, Remove
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}

export default function ZippHubPage() {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <Tabs defaultValue="favourites" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="favourites">Favourites</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
          </TabsList>
          <TabsContent value="favourites" className="mt-6">
            <FavouritesList />
          </TabsContent>
          <TabsContent value="promotions" className="mt-6">
            <PromotionsList />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
