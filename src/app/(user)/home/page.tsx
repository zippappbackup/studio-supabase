
'use client';

import * as React from "react";
import Link from 'next/link';
import type { Vendor } from "@/lib/types";
import Image from 'next/image';
import { useAppCache } from '@/context/AppCacheProvider';
import { PlaceholderImages } from '@/lib/placeholder-images';
import { getLogoUrl } from '@/lib/utils';
import { Star, Loader2, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const INITIAL_LOAD_COUNT = 4;
const LOAD_MORE_COUNT = 4;

function ZippHighlights() {
    const { zippHighlights, isHighlightsLoading } = useAppCache();
    const [displayCount, setDisplayCount] = React.useState(INITIAL_LOAD_COUNT);
    const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (isHighlightsLoading || !zippHighlights) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setDisplayCount((prevCount) => {
                        return Math.min(prevCount + LOAD_MORE_COUNT, zippHighlights.length);
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
    }, [isHighlightsLoading, zippHighlights]);
    
    if (isHighlightsLoading) {
      return null;
    }
    
    if (!zippHighlights || zippHighlights.length === 0) {
        return null;
    }
    
    const visibleHighlights = zippHighlights.slice(0, displayCount);

    return (
        <div className="mt-2">
            <h2 className="mb-4 text-2xl font-bold tracking-tight">
              Zipp Highlights <span className="text-base font-medium text-accent">| Spotlighted Businesses</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleHighlights.map((vendor) => {
                    const logoUrl = getLogoUrl(vendor);
                    const rating = vendor.zippRating || vendor.googleRating;
                    const reviewCount = vendor.zippReviewCount || vendor.googleReviewCount;
                    const displayCategory = vendor.categoryId
                        ? vendor.categoryId
                              .split('-')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')
                        : '';
                    const vendorKeywords = (vendor.matchedKeywords || []).filter(kw => kw && kw !== 'establishment' && kw !== 'point_of_interest');

                    return (
                        <Link href={`/vendor/${vendor.id}`} key={vendor.id}>
                            <Card
                              className="flex flex-col h-full items-start p-4 border border-border"
                            >
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
                            </Card>
                        </Link>
                    );
                })}
            </div>
            <div ref={loadMoreRef} className="h-1 col-span-full mt-4" />
            {displayCount < zippHighlights.length && (
                <div className="flex justify-center items-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
}

export default function UserHomePage() {
  return (
    <TooltipProvider>
        <div className="w-full">
            <ZippHighlights />
        </div>
    </TooltipProvider>
  );
}
