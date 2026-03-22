'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSupabaseDoc, useSupabaseCollection } from '@/lib/supabase/hooks';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Navigation, ArrowLeft, Star, FileText, Phone, MapPin, Globe, ChevronDown, X, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Vendor, Promotion, Offering, Review, ZippUser, UserCollection, RedemptionEvent, GooglePhoto } from "@/lib/types";
import { useRouter, notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";
import { logActivity } from "@/lib/activity-logger";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { cn, getLogoUrl } from '@/lib/utils';
import VendorFavoriteButton from './VendorFavoriteButton';
import { Textarea } from '@/components/ui/textarea';
import { ReviewItem } from './ReviewItem';
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
import { useAppCache } from '@/context/AppCacheProvider';
import { PlaceholderImages } from '@/lib/placeholder-images';
import { v4 as uuidv4 } from 'uuid';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const VendorLocationMap = dynamic(() => import('./VendorLocationMap'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-muted rounded-md animate-pulse flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>,
});

const getSafeDate = (dateInput: any): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput.toDate === 'function') return dateInput.toDate();
    if (typeof dateInput === 'object' && dateInput !== null && typeof (dateInput as any)._seconds === 'number') {
        return new Date((dateInput as any)._seconds * 1000);
    }
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) return date;
    return null;
};

function PromoCard({ promotion, onCollect, isCollected, isCollectionDisabled }: { promotion: Promotion; onCollect: () => void; isCollected: boolean; isCollectionDisabled: boolean; }) {
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
                data-ai-hint={promotion.imageUrl ? "promotion deal" : "deal placeholder"}
            />
        </div>
        <CardHeader>
            <CardTitle>{promotion.title}</CardTitle>
            {endDate && (
                 <CardDescription>
                    Expires on {format(endDate, "dd MMM yyyy")}
                </CardDescription>
            )}
            <Separator className="my-2" />
        </CardHeader>
        <CardContent className="flex-1 pt-0">
            <p className="text-sm text-muted-foreground">{promotion.description}</p>
        </CardContent>
        <CardFooter>
            <Button onClick={onCollect} disabled={isCollected || isCollectionDisabled} className="w-full">
                {isCollected ? "Collected" : "Collect this Promotion"}
            </Button>
        </CardFooter>
    </Card>
  );
}

function OfferingItem({ offering }: { offering: Offering }) {
    return (
        <div className="py-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <p className="font-semibold">{offering.name}</p>
                    <p className="text-sm text-muted-foreground">{offering.description}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: offering.currency }).format(offering.price)}</p>
                    {offering.type === 'service' && offering.pricingModel !== 'fixed' && (
                        <p className="text-xs text-muted-foreground capitalize">per {offering.pricingModel?.split('_')[1]}</p>
                    )}
                </div>
            </div>
        </div>
    )
}

function WriteReview({ vendor, onReviewAdded, existingReview, onCancelEdit }: { vendor: Vendor, onReviewAdded: (newReview: Review) => void, existingReview?: Review, onCancelEdit?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = !!existingReview;

  useEffect(() => {
    if (isEditing && existingReview) {
      setRating(existingReview.rating);
      setText(existingReview.text);
    } else {
        setRating(0);
        setText("");
    }
  }, [existingReview, isEditing]);


  if (!user) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4 border rounded-md">
        <Link href="/login" className="text-primary underline">Log in</Link> to leave a review.
      </div>
    );
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({title: "Please select a star rating.", variant: "destructive" });
      return;
    }
    if (!text.trim()) {
      toast({title: "Please write something for your review.", variant: "destructive" });
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      // Fetch current vendor data
      const { data: vendorData, error: fetchError } = await supabase
        .from('vendors')
        .select('reviews, zipp_rating, zipp_review_count')
        .eq('vendor_id', vendor.id)
        .single();

      if (fetchError) throw fetchError;

      const { data: userData } = await supabase
        .from('users')
        .select('name, photo_url')
        .eq('uid', user.uid)
        .single();

      const existingReviews: Review[] = vendorData.reviews || [];
      const userReviewIndex = existingReviews.findIndex((r: Review) => r.userId === user.uid);

      let newReviews: Review[];
      let newTotalRating = (vendorData.zipp_rating || 0) * (vendorData.zipp_review_count || 0);
      let newReviewCount = vendorData.zipp_review_count || 0;
      let finalReview: Review;

      const displayName = userData?.name || "A Zipp User";
      const userAvatar = userData?.photo_url ?? null;

      if (userReviewIndex > -1) {
        const originalReview = existingReviews[userReviewIndex];
        newTotalRating = newTotalRating - originalReview.rating + rating;
        newReviews = [...existingReviews];
        finalReview = {
          ...originalReview,
          rating,
          text,
          userName: displayName,
          userAvatar: userAvatar,
          updatedAt: new Date().toISOString(),
        };
        newReviews[userReviewIndex] = finalReview;
      } else {
        finalReview = {
          id: user.uid,
          vendorId: vendor.id,
          userId: user.uid,
          userName: displayName,
          userAvatar: userAvatar,
          rating,
          text,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        newReviews = [...existingReviews, finalReview];
        newTotalRating += rating;
        newReviewCount += 1;
      }

      const newAverageRating = newReviewCount > 0 ? newTotalRating / newReviewCount : 0;

      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          reviews: newReviews,
          zipp_rating: newAverageRating,
          zipp_review_count: newReviewCount,
          updated_at: new Date().toISOString(),
        })
        .eq('vendor_id', vendor.id);

      if (updateError) throw updateError;

      toast({title: isEditing ? "Your review has been updated." : "Thank you for your review.", variant: "success"});

      if (onCancelEdit) {
        onCancelEdit();
      } else {
        setRating(0);
        setText("");
      }
      onReviewAdded(finalReview);

    } catch(error: any) {
        toast({title: "Submission failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return "U";
    const words = name.split(" ").filter(Boolean);
    if (words.length === 0) return "U";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar>
            <AvatarImage src={user.photoURL ?? ''} alt={user.name ?? ''} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <h4 className="font-semibold">{isEditing ? 'Edit Your Review' : 'Write a Review'}</h4>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-7 w-7 cursor-pointer transition-colors",
              (hoverRating || rating) >= star
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            )}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          />
        ))}
      </div>
      <Textarea
        placeholder="Share your experience..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
      />
      <div className="flex items-center gap-2">
        <Button onClick={handleSubmitReview} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Review' : 'Submit Review'}
        </Button>
        {isEditing && <Button variant="ghost" onClick={onCancelEdit}>Cancel</Button>}
      </div>
    </div>
  );
}

export function VendorProfileClientPage({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories: allCategories, getVendorFromSnapshot, isVendorDataReady } = useAppCache();

  // State for the initial vendor data from the snapshot cache
  const [vendorFromSnapshot, setVendorFromSnapshot] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useDoc for fetching live, detailed data
  const [editingReview, setEditingReview] = useState<Review | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);

  const vendorQuery = useMemo(
    () => vendorId ? () => supabase.from('vendors').select('*').eq('vendor_id', vendorId).single() : () => null,
    [vendorId]
  );
  const { data: liveVendor, isLoading: isLiveVendorLoading } = useSupabaseDoc<Vendor>(vendorQuery);

  // Fetch reviews separately to avoid 406 errors from PostgREST join
  const reviewsQuery = useMemo(
    () => vendorId ? () => supabase.from('reviews').select('*').eq('vendor_id', vendorId) : () => null,
    [vendorId, reviewsRefreshKey]
  );
  const { data: vendorReviews } = useSupabaseCollection<any>(reviewsQuery);

  const userQuery = useMemo(
    () => user ? () => supabase.from('users').select('*').eq('uid', user.uid).single() : () => null,
    [user]
  );
  const { data: userData } = useSupabaseDoc<ZippUser>(userQuery);

  // Effect 1: Initial load from snapshot cache.
  useEffect(() => {
    if (!vendorId || !isVendorDataReady) return;
    
    async function loadInitialData() {
        setIsLoading(true);
        const snapshotVendor = await getVendorFromSnapshot(vendorId);
        
        if (snapshotVendor) {
            setVendorFromSnapshot(snapshotVendor);
        }
        setIsLoading(false);
    }
    
    loadInitialData();
  }, [vendorId, getVendorFromSnapshot, isVendorDataReady]);

  // Derived state: Merge snapshot and live data. Prioritize live data.
  // Transform snake_case from Supabase to camelCase expected by the UI
  const hydratedVendor = useMemo(() => {
    const source = liveVendor || vendorFromSnapshot;
    if (!source) return null;
    return {
      ...source,
      id: (source as any).vendor_id || source.id,
      categoryId: (source as any).category_id || source.categoryId,
      logoUrl: (source as any).logo_url || source.logoUrl,
      googleRating: (source as any).google_rating ?? source.googleRating,
      googleReviewCount: (source as any).google_review_count ?? source.googleReviewCount,
      zippRating: (source as any).zipp_rating ?? source.zippRating,
      zippReviewCount: (source as any).zipp_review_count ?? source.zippReviewCount,
      operatingHours: (source as any).operating_hours || source.operatingHours,
      googlePlaceId: (source as any).google_place_id || source.googlePlaceId,
      normalizedName: (source as any).normalized_name || source.normalizedName,
      searchableName: (source as any).searchable_name || source.searchableName,
      matchedKeywords: (source as any).matched_keywords || source.matchedKeywords,
      modulesEnabled: (source as any).modules_enabled || source.modulesEnabled,
      subscriptionStatus: (source as any).subscription_status || source.subscriptionStatus,
      businessStatus: (source as any).business_status || source.businessStatus,
      reviews: vendorReviews || (source as any).reviews || [],
      offerings: (source as any).offerings || [],
      promotions: (source as any).promotions || [],
      photos: (source as any).photos || [],
    } as Vendor;
  }, [vendorFromSnapshot, liveVendor]);


  useEffect(() => {
    if (user && hydratedVendor) {
      const storageKey = `review_submitted_${hydratedVendor.id}_${user.uid}`;
      const submitted = localStorage.getItem(storageKey);
      if (submitted === 'true') {
        setHasSubmittedReview(true);
      }
    }
  }, [user, hydratedVendor]);

  useEffect(() => {
      if (vendorId && user && hydratedVendor?.name) {
          // Increment profile views
          supabase.rpc('increment_profile_views', { vendor_id_param: vendorId })
            .then(({ error }) => { if (error) console.warn("Failed to increment profile view count:", error); });
          // Log activity
          logActivity(supabase, user.uid, 'view_vendor', { vendorId: vendorId, vendorName: hydratedVendor.name });
      }
  }, [vendorId, user, hydratedVendor?.name]);


  const offerings = hydratedVendor?.offerings || [];
  const vendorPromotions = useMemo(() => {
    if (!hydratedVendor || !hydratedVendor.promotions) return [];
    return hydratedVendor.promotions.filter(p => {
        const endDate = getSafeDate(p.endAt);
        return endDate ? endDate > new Date() : false;
    });
  }, [hydratedVendor]);
  
  const zippReviews = useMemo(() => (hydratedVendor?.reviews || []).filter(r => r.userId), [hydratedVendor?.reviews]);
  const googleReviews = useMemo(() => (hydratedVendor?.reviews || []).filter(r => !r.userId), [hydratedVendor?.reviews]);

  const userReview = useMemo(() => {
    if (!user || !zippReviews) return undefined;
    return zippReviews.find(r => r.userId === user.uid);
  }, [user, zippReviews]);
  
  const canWriteReview = !userReview && !hasSubmittedReview;

  const sortedZippReviews = useMemo(() => {
      const otherReviews = zippReviews.filter(r => r.userId !== user?.uid) || [];
      const getReviewDate = (review: Review) => {
          const date = getSafeDate(review.createdAt);
          return date ? date.getTime() : 0;
      };

      otherReviews.sort((a, b) => getReviewDate(b) - getReviewDate(a));
      
      const currentUserReview = userReview ? [userReview] : [];
      return [...currentUserReview, ...otherReviews];
  }, [zippReviews, user, userReview]);


  const handleReviewAdded = (newReview: Review) => {
    if (user && hydratedVendor) {
      const storageKey = `review_submitted_${hydratedVendor.id}_${user.uid}`;
      localStorage.setItem(storageKey, 'true');
    }
    setHasSubmittedReview(true);
    setReviewsRefreshKey(k => k + 1);
  };


  const handleDeleteReview = (review: Review) => {
    setReviewToDelete(review);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!reviewToDelete || !hydratedVendor || !user) return;
    
    setIsDeleteDialogOpen(false);
    setDeletingReviewId(reviewToDelete.id);
    toast({ title: "Your review is being deleted", variant: "info" });

    try {
        const { data: vendorData, error: fetchError } = await supabase
          .from('vendors')
          .select('reviews, zipp_rating, zipp_review_count')
          .eq('vendor_id', hydratedVendor.id)
          .single();

        if (fetchError) throw fetchError;

        const currentReviews: Review[] = vendorData.reviews || [];
        const reviewToRemove = currentReviews.find((r: Review) => r.userId === reviewToDelete.userId);
        if (!reviewToRemove) return;

        const newReviews = currentReviews.filter((r: Review) => r.userId !== reviewToDelete.userId);
        const newTotalRating = (vendorData.zipp_rating || 0) * (vendorData.zipp_review_count || 0) - reviewToRemove.rating;
        const newReviewCount = Math.max(0, (vendorData.zipp_review_count || 0) - 1);
        const newAverageRating = newReviewCount > 0 ? newTotalRating / newReviewCount : 0;

        const { error: updateError } = await supabase
          .from('vendors')
          .update({
            reviews: newReviews,
            zipp_rating: newAverageRating,
            zipp_review_count: newReviewCount,
            updated_at: new Date().toISOString(),
          })
          .eq('vendor_id', hydratedVendor.id);

        if (updateError) throw updateError;

        const storageKey = `review_submitted_${hydratedVendor.id}_${user.uid}`;
        localStorage.removeItem(storageKey);
        setHasSubmittedReview(false);

        if (editingReview?.id === reviewToDelete.id) {
          setEditingReview(undefined);
        }

    } catch (error) {
      console.error("Failed to delete review:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Failed to delete review", description: errorMessage, variant: "destructive" });
    } finally {
        setReviewsRefreshKey(k => k + 1);
        setTimeout(() => {
            setDeletingReviewId(null);
            setReviewToDelete(null);
        }, 1000);
    }
  };

  const handleCollect = async (promotion: Promotion) => {
    if (!user || !hydratedVendor) {
        toast({ title: "Login Required", description: "You must be logged in to collect promotions.", variant: "destructive" });
        return;
    }
    
    toast({ title: "Collecting promotion...", variant: "info" });
    
    try {
        const redemptionId = uuidv4();
        
        // Update user's collected promotions
        const { data: currentUser } = await supabase
          .from('users')
          .select('collected_promotions')
          .eq('uid', user.uid)
          .single();

        const newCollection: UserCollection = {
            promotionId: promotion.id,
            vendorId: hydratedVendor.id,
            collectedAt: new Date().toISOString(),
            redemptionId: redemptionId,
        };

        const updatedCollections = [...(currentUser?.collected_promotions || []), newCollection];

        await supabase
          .from('users')
          .update({ collected_promotions: updatedCollections })
          .eq('uid', user.uid);

        // Update vendor's promotion redemptions
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('promotions')
          .eq('vendor_id', hydratedVendor.id)
          .single();

        const newRedemptionEvent: RedemptionEvent = {
            redemptionId: redemptionId,
            userId: user.uid,
            status: 'collected',
            collectedAt: new Date().toISOString(),
        };

        const newPromotions = [...(vendorData?.promotions || [])];
        const promoIndex = newPromotions.findIndex((p: Promotion) => p.id === promotion.id);
        if (promoIndex > -1) {
            const currentRedemptions = newPromotions[promoIndex].redemptions || [];
            newPromotions[promoIndex].redemptions = [...currentRedemptions, newRedemptionEvent];
            await supabase
              .from('vendors')
              .update({ promotions: newPromotions })
              .eq('vendor_id', hydratedVendor.id);
        }
        
        toast({ title: "Promotion Collected!", description: "View it in your Zipp Hub.", variant: "success" });
    } catch (error: any) {
        toast({ title: "Failed to collect", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading || (isLiveVendorLoading && !hydratedVendor)) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!hydratedVendor) {
    notFound();
    return null;
  }

  const logoUrl = getLogoUrl(hydratedVendor);


  const getOfferingsTabTitle = () => {
    switch (hydratedVendor.categoryId) {
        case 'f-and-b': return 'Menu';
        case 'cleaning': return 'Services';
        case 'groceries': return 'Products';
        default: return 'Offerings';
    }
  }

  const handleNavigate = () => {
    if (hydratedVendor.lat && hydratedVendor.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${hydratedVendor.lat},${hydratedVendor.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  
  const userHasActiveCollection = (promoId: string) => {
    return userData?.collectedPromotions?.some(p => p.promotionId === promoId);
  }
  
  const visibleTabs = [
    offerings.length > 0 && { value: "offerings", label: getOfferingsTabTitle() },
    { value: "info", label: "More Info" },
    { value: "reviews", label: "Reviews" },
    vendorPromotions.length > 0 && { value: "promotions", label: "Promotions" },
  ].filter(Boolean) as { value: string; label: string }[];

  const defaultTab = visibleTabs.length > 0 ? visibleTabs[0].value : "info";
  
  const reorderedTabs = [
    ...visibleTabs.filter(t => t.value !== 'info' && t.value !== 'reviews' && t.value !== 'promotions'),
    visibleTabs.find(t => t.value === 'info'),
    visibleTabs.find(t => t.value === 'reviews'),
    visibleTabs.find(t => t.value === 'promotions'),
  ].filter(Boolean) as { value: string; label: string }[];

  const vendorTypes = (hydratedVendor?.types || []).filter(type => type !== 'establishment' && type !== 'point_of_interest' && type !== 'store');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-2 right-2">
                <Button onClick={() => router.back()} size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Back</span>
                </Button>
              </div>
              <div className="flex flex-row items-start gap-4 mt-4">
                  <div className="w-14 h-14 flex-shrink-0">
                      <Image
                        unoptimized
                        src={logoUrl}
                        alt={`${hydratedVendor.name} Logo`}
                        width={56}
                        height={56}
                        className="rounded-lg object-cover w-full h-full aspect-square"
                        data-ai-hint={logoUrl !== PlaceholderImages['vendor-logo-placeholder'].imageUrl ? "vendor logo" : "logo placeholder"}
                      />
                  </div>
                  <div className="flex-1 w-full space-y-1">
                      <div className="flex items-baseline gap-2">
                          <h1 className="text-lg font-bold leading-tight">{hydratedVendor.name}</h1>
                          {hydratedVendor.subscriptionStatus === 'verified' && (
                              <Tooltip>
                                  <TooltipTrigger>
                                      <ShieldCheck className="h-5 w-5 text-blue-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>Verified Vendor</p>
                                  </TooltipContent>
                              </Tooltip>
                          )}
                          <VendorFavoriteButton vendor={hydratedVendor} />
                      </div>
                      
                      <div className="flex items-center justify-between gap-1.5 flex-wrap text-sm">
                          <div className="flex items-center gap-1.5 flex-wrap">
                          {hydratedVendor.categoryId && <p className="text-sm text-accent capitalize font-medium">{hydratedVendor.categoryId.replace(/-/g, ' ')}</p>}
                          {hydratedVendor.categoryId && vendorTypes.length > 0 && <span className="mx-1">|</span>}
                          {vendorTypes.slice(0, 2).map((type, index) => (
                              <React.Fragment key={type}>
                              <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                              {index < vendorTypes.slice(0, 2).length - 1 && <span className="mx-1">&middot;</span>}
                              </React.Fragment>
                          ))}
                          </div>
                      </div>
                      <div className="flex items-center gap-1.5" title="Google Rating">
                          {(hydratedVendor.googleRating ?? 0) > 0 ? (
                              <>
                                  <span className="text-foreground text-sm">Google:</span>
                                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                  <span className="font-semibold text-sm">{hydratedVendor.googleRating?.toFixed(1)}</span>
                                  <span className="text-muted-foreground text-xs">({hydratedVendor.googleReviewCount || 0})</span>
                              </>
                          ) : ((hydratedVendor.zippRating ?? 0) === 0) && (
                              <div className="flex items-center gap-1">
                                  <Star className="h-5 w-5 text-gray-300" />
                                  <span className="font-semibold text-muted-foreground">New</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
              
              <Separator className="my-4" />

              <div className="space-y-4">
                  {(hydratedVendor.zippRating ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5" title="Zipp Verified Rating">
                      <span className="font-semibold text-muted-foreground">Zipp:</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold">{hydratedVendor.zippRating?.toFixed(1)}</span>
                      <span className="text-muted-foreground text-xs">({hydratedVendor.zippReviewCount || 0})</span>
                      </div>
                  )}
                  {hydratedVendor.address && (
                    <div className="flex items-start gap-3 pt-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        <span className="text-foreground">{hydratedVendor.address}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    {hydratedVendor.phone && (
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <a href={`tel:${hydratedVendor.phone}`} className="text-blue-600">{hydratedVendor.phone}</a>
                        </div>
                    )}
                    {hydratedVendor.website && (
                        <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <a href={hydratedVendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600">{hydratedVendor.website}</a>
                        </div>
                    )}
                  </div>
              </div>
            </CardContent>

            {hydratedVendor.photos && hydratedVendor.photos.length > 0 && (
            <Carousel
                opts={{
                align: "start",
                }}
                className="w-full"
            >
                <CarouselContent>
                {hydratedVendor.photos.map((photo, index) => {
                    let photoUrl: string | null = null;
                    if (typeof photo === 'string') {
                        photoUrl = photo;
                    } else if (typeof photo === 'object' && photo !== null && 'photo_reference' in photo) {
                        // Cannot construct URL without API key on client
                    }

                    if (!photoUrl) return null; // Skip invalid photo entries

                    return (
                    <CarouselItem key={index} className="basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                        <div className="p-1">
                          <Card>
                              <CardContent className="flex aspect-video items-center justify-center p-0 rounded-lg overflow-hidden">
                              <Image src={photoUrl} alt={`Vendor photo ${index + 1}`} width={400} height={300} className="object-cover w-full h-full" />
                              </CardContent>
                          </Card>
                        </div>
                    </CarouselItem>
                    )
                })}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            )}
            
            <Tabs defaultValue={defaultTab} className="mt-6">
              <TabsList className={cn("grid w-full", `grid-cols-${reorderedTabs.length}`)}>
                {reorderedTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="offerings" className="mt-4 p-6">
                      <CardHeader className="p-0 mb-4">
                          <CardTitle>{getOfferingsTabTitle()}</CardTitle>
                          <CardDescription>A list of products and services offered by this vendor.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                          {offerings.length > 0 ? (
                              <div className="divide-y">
                                  {offerings.map(offering => <OfferingItem key={offering.id} offering={offering} />)}
                              </div>
                          ) : (
                              <p className="text-sm text-muted-foreground text-center p-8">This vendor has not listed any items yet.</p>
                          )}
                      </CardContent>
              </TabsContent>

              <TabsContent value="promotions" className="mt-4 p-6">
                <CardHeader className="p-0 mb-4"><CardTitle>Active Promotions</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {vendorPromotions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {vendorPromotions.map(promo => {
                        const isCollected = userHasActiveCollection(promo.id);
                        return <PromoCard key={promo.id} promotion={promo} onCollect={() => handleCollect(promo)} isCollected={isCollected} isCollectionDisabled={isCollected} />
                        })}
                    </div>
                    ) : (
                    <p className="text-sm text-muted-foreground text-center p-8">No active promotions available for this vendor.</p>
                    )}
                </CardContent>
              </TabsContent>
              
              <TabsContent value="info" className="mt-4 p-6">
                  <CardContent className="space-y-4 p-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4 text-sm">
                          <div>
                              <h4 className="font-semibold mb-2">Operating Hours</h4>
                              {hydratedVendor.operatingHours && Array.isArray(hydratedVendor.operatingHours) && hydratedVendor.operatingHours.length > 0 ? (
                                  <div className="grid grid-cols-1 gap-y-1 text-muted-foreground text-xs">
                                    {hydratedVendor.operatingHours.map((item, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span>{item.split(': ')[0]}</span>
                                            <span className="text-right">{item.split(': ').slice(1).join(': ')}</span>
                                        </div>
                                    ))}
                                  </div>
                              ) : (
                                  <p className="text-xs text-muted-foreground">Operating hours not stated.</p>
                              )}
                          </div>
                        </div>
                        <div className="space-y-4">
                            {hydratedVendor.lat && hydratedVendor.lng && (
                                <div className="h-48 w-full rounded-md overflow-hidden border">
                                    <VendorLocationMap vendorLoc={[hydratedVendor.lat, hydratedVendor.lng]} vendorName={hydratedVendor.name} />
                                </div>
                            )}
                            <Button onClick={handleNavigate} className="w-full" disabled={!hydratedVendor.lat || !hydratedVendor.lng}>
                                <Navigation className="mr-2 h-4 w-4" />
                                Navigate with Google Maps
                            </Button>
                        </div>
                      </div>
                  </CardContent>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-4 p-6">
                      <CardHeader className="p-0 mb-4">
                          <div className="flex flex-col items-center justify-center text-center pb-6 border-b">
                                <p className="text-4xl font-bold">{(hydratedVendor.zippRating || hydratedVendor.googleRating || 0).toFixed(1)}</p>
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-6 w-6 ${i < Math.round(hydratedVendor.zippRating || hydratedVendor.googleRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">Based on {(hydratedVendor.zippReviewCount || 0) + (hydratedVendor.googleReviewCount || 0)} reviews</p>
                            </div>
                          <CardTitle>Customer Reviews</CardTitle>
                          <CardDescription>See what the community is saying.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-8 p-0">
                            <div className="pt-4">
                                {editingReview ? (
                                      <WriteReview vendor={hydratedVendor} onReviewAdded={handleReviewAdded} existingReview={editingReview} onCancelEdit={() => setEditingReview(undefined)} />
                                ) : canWriteReview ? (
                                      <WriteReview vendor={hydratedVendor} onReviewAdded={handleReviewAdded} />
                                ) : null}
                            </div>
                          <Separator/>
                          <div>
                            <h4 className="font-semibold mb-4">Zipp Reviews ({zippReviews.length})</h4>
                            {sortedZippReviews.length > 0 ? (
                              <div className="space-y-4">
                                {sortedZippReviews.map(review => (
                                  <ReviewItem 
                                      key={review.id || `user-${review.userId}`} 
                                      review={review} 
                                      isCurrentUser={review.userId === user?.uid}
                                      isDeleting={deletingReviewId === review.id}
                                      onEdit={() => setEditingReview(review)}
                                      onDelete={() => handleDeleteReview(review)}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">Be the first to leave a Zipp review!</p>
                            )}
                          </div>
                          {googleReviews.length > 0 && (
                              <>
                                <Separator/>
                                <div>
                                    <h4 className="font-semibold mb-4">Google Reviews ({googleReviews.length})</h4>
                                    <div className="space-y-4 divide-y">
                                    {googleReviews.map((review, index) => (
                                        <ReviewItem 
                                            key={`google-${index}`} 
                                            review={{...review, id: `google-${index}`}} 
                                            isCurrentUser={false}
                                            isDeleting={false}
                                            onEdit={() => {}}
                                            onDelete={() => {}}
                                        />
                                    ))}
                                    </div>
                                </div>
                              </>
                          )}
                      </CardContent>
              </TabsContent>
            </Tabs>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReviewToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
