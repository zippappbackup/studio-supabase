"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import "leaflet/dist/leaflet.css";
import type { Vendor, Landmark, Category, GooglePhoto } from "@/lib/types";
import { Loader2, Star, Search, X, Map as MapIcon, MapPin, Percent, Award, ShieldCheck } from "lucide-react";
import { VendorMap } from "./VendorMap";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppCache } from '@/context/AppCacheProvider';
import { cn, getLogoUrl } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { PlaceholderImages } from '@/lib/placeholder-images';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- Haversine Distance Calculation ---
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

const DEFAULT_LOCATION: [number, number] = [1.3521, 103.8198]; // Default to Singapore center
const INITIAL_LOAD_COUNT = 8;
const LOAD_MORE_COUNT = 8;

const VendorCard = React.memo(function VendorCard({ vendor, allCategories }: { vendor: Vendor, allCategories: Category[] }) {
    const logoUrl = getLogoUrl(vendor);
    const isCategoryIcon = logoUrl.endsWith('.svg');

    const rating = vendor.zippRating || vendor.googleRating;
    const reviewCount = vendor.zippReviewCount || vendor.googleReviewCount;
    const category = allCategories.find(cat => cat.id === vendor.categoryId);
    const displayCategory = category ? category.name : (vendor.categoryId || '').replace(/-/g, ' ');
    const vendorKeywords = (vendor.matchedKeywords || []).filter(kw => kw && kw !== 'establishment' && kw !== 'point_of_interest');


    return (
        <Link href={`/vendor/${vendor.id}`}>
           <Card className="flex flex-col h-full items-start p-4 border border-border">
                <div className="flex items-start gap-4 w-full">
                    
                    {isCategoryIcon ? (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary flex-shrink-0">
                             <Image 
                                src={logoUrl} 
                                alt={displayCategory || "Category"} 
                                width={28} 
                                height={28} 
                                className="h-7 w-7 filter-primary-foreground"
                            />
                        </div>
                    ) : (
                        <Image
                            unoptimized
                            src={logoUrl}
                            alt={`${vendor.name} logo`}
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-lg object-cover force-no-border flex-shrink-0"
                            data-ai-hint="vendor logo"
                        />
                    )}

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
                          {displayCategory && <p className="text-sm text-accent capitalize font-medium">{displayCategory}</p>}
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
                        {vendor.distance != null && (
                            <p className="text-sm text-primary font-bold text-right">{vendor.distance.toFixed(2)} km</p>
                        )}
                        {rating ? (
                            <div className="flex items-center gap-1">
                                <Star className="w-4 w-4 text-yellow-400 fill-yellow-400" />
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
            </Card>
        </Link>
    );
});
VendorCard.displayName = 'VendorCard';


const SearchResultsPageClient = React.memo(function SearchResultsPageClient() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { 
        vendorDataset,
        isVendorDataReady,
        categories: allCategories, 
        userLocation: currentGeoLocation, 
        isLocationLoading, 
        getUserLocation 
    } = useAppCache();
    
    // State for user inputs
    const keywordFromUrl = searchParams.get('keyword') || '';
    const categoryFromUrl = searchParams.get('category') || 'all';
    const locationFromUrl = searchParams.get('location') || '';
    const nearbyFromUrl = searchParams.get('nearby') === 'true';
    const mapFromUrl = searchParams.get('map') === 'true';
    const promotionsFromUrl = searchParams.get('promotions') === 'true';
    const topRatedFromUrl = searchParams.get('topRated') === 'true';
    
    // State for data and results
    const [searchResults, setSearchResults] = useState<Vendor[]>([]);
    
    // State for location and map
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [landmark, setLandmark] = useState<Landmark | null>(null);
    
    const [isNearbyEnabled, setIsNearbyEnabled] = useState(nearbyFromUrl);
    const [isMapVisible, setIsMapVisible] = useState(mapFromUrl);
    
    // Infinite scroll state
    const [displayCount, setDisplayCount] = useState(INITIAL_LOAD_COUNT);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const isLoading = !isVendorDataReady || isLocationLoading;
    const isSearchActive = !!keywordFromUrl || categoryFromUrl !== 'all' || !!locationFromUrl || nearbyFromUrl || promotionsFromUrl || topRatedFromUrl;


    const vendorIdsWithActivePromos = useMemo(() => {
        if (!vendorDataset) return new Set<string>();
        const vendorIds = new Set<string>();
        const now = new Date();
        for (const vendor of vendorDataset) {
            if (vendor.promotions && vendor.promotions.length > 0) {
                const hasActivePromo = vendor.promotions.some(promo => {
                    const endDate = getSafeDate(promo.endAt);
                    return endDate ? endDate > now : false;
                });
                if (hasActivePromo) {
                    vendorIds.add(vendor.id);
                }
            }
        }
        return vendorIds;
    }, [vendorDataset]);

    const fuse = useMemo(() => {
        if (!isVendorDataReady || !vendorDataset) return null;
        
        return new Fuse(vendorDataset, {
            keys: [
                { name: 'name', weight: 0.5 },
                { name: 'tags', weight: 0.2 },
                { name: 'matchedKeywords', weight: 0.2 },
                { name: 'categoryId', weight: 0.1 },
            ],
            threshold: 0.3,
            includeScore: true,
            minMatchCharLength: 2,
        });

    }, [isVendorDataReady, vendorDataset]);


    useEffect(() => {
        setIsNearbyEnabled(nearbyFromUrl);
        setIsMapVisible(mapFromUrl);
        
        async function determineMapCenter() {
            if (nearbyFromUrl) {
                const location = await getUserLocation();
                setMapCenter(location || DEFAULT_LOCATION);
            } else if (locationFromUrl) {
                const geoResponse = await fetch(`/api/geocode?address=${encodeURIComponent(locationFromUrl)}`);
                const result = await geoResponse.json();
                if (result.success && result.lat && result.lng) {
                    setMapCenter([result.lat, result.lng]);
                } else {
                    setMapCenter(DEFAULT_LOCATION);
                }
            } else {
                setMapCenter(DEFAULT_LOCATION);
            }
        }
        determineMapCenter();

    }, [locationFromUrl, nearbyFromUrl, getUserLocation]);

    useEffect(() => {
        if (!isVendorDataReady || !mapCenter || !fuse) {
            return;
        }

        let baseResults: Vendor[];
        
        if (keywordFromUrl.trim()) {
            baseResults = fuse.search(keywordFromUrl).map(result => result.item);
        } else {
            baseResults = [...vendorDataset];
        }
        
        let filteredResults = baseResults;
        
        if (categoryFromUrl !== 'all') {
            const normalizedCategory = categoryFromUrl.toLowerCase().replace(/-/g, ' ');
            filteredResults = filteredResults.filter(v => v.categoryId === normalizedCategory);
        }

        if (promotionsFromUrl) {
            filteredResults = filteredResults.filter(v => vendorIdsWithActivePromos.has(v.id));
        }

        if (topRatedFromUrl) {
            filteredResults = filteredResults.filter(v => (v.zippRating ?? 0) >= 4 || (v.googleRating ?? 0) >= 4);
        }

        if (isNearbyEnabled || locationFromUrl) {
            filteredResults.forEach(v => {
                v.distance = v.lat && v.lng ? haversine(mapCenter[0], mapCenter[1], v.lat, v.lng) : undefined;
            });
            filteredResults = filteredResults.filter(v => v.distance !== undefined && v.distance <= 3);
            filteredResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        } else {
            filteredResults.forEach(v => { v.distance = undefined; });
        }

        setSearchResults(filteredResults);
        setDisplayCount(INITIAL_LOAD_COUNT);

    }, [keywordFromUrl, categoryFromUrl, locationFromUrl, promotionsFromUrl, topRatedFromUrl, fuse, mapCenter, vendorDataset, isNearbyEnabled, isVendorDataReady, vendorIdsWithActivePromos]);

    useEffect(() => {
        if (isLoading) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setDisplayCount((prevCount) => {
                        const newCount = Math.min(prevCount + LOAD_MORE_COUNT, searchResults.length);
                        return newCount;
                    });
                }
            },
            { threshold: 1.0 }
        );
        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }
        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [isLoading, searchResults.length]);
    
    const effectiveMapCenter = landmark ? [landmark.lat, landmark.lng] as [number, number] : mapCenter;
    const visibleVendors = searchResults.slice(0, displayCount);

    return (
      <TooltipProvider>
          <div className="w-full">
            <div className="mt-6">
                {isMapVisible && effectiveMapCenter && <div className="h-[400px] w-full rounded-lg overflow-hidden border my-4"><VendorMap center={effectiveMapCenter} vendors={searchResults} landmark={landmark} /></div>}
                
                {isSearchActive && (
                    <h2 className="mb-4 text-2xl font-bold tracking-tight">
                        {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'}
                    </h2>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center p-10 text-muted-foreground col-span-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                    {!isLoading && searchResults.length === 0 && isSearchActive && (
                         <div className="flex flex-col items-center justify-center p-10 text-muted-foreground col-span-full">
                            <Search className="h-8 w-8" />
                            <p className="mt-2 text-center">No vendors found matching your criteria. Try a broader search.</p>
                        </div>
                    )}
                    {!isLoading && visibleVendors.map((v) => (
                        <VendorCard key={v.id} vendor={v} allCategories={allCategories} />
                    ))}
                </div>
                <div ref={loadMoreRef} className="h-1 col-span-full mt-4" />
            </div>
          </div>
      </TooltipProvider>
    );
});
SearchResultsPageClient.displayName = 'SearchResultsPageClient';

export default SearchResultsPageClient;
