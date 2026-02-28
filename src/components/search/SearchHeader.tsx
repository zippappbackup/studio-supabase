
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, MapPin, Map as MapIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppCache } from '@/context/AppCacheProvider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';
import { Loader2 } from 'lucide-react';

export function SearchHeader() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, db } = useAuth();
    const { toast } = useToast();
    const { categories: allCategories, getUserLocation, isLocationLoading } = useAppCache();

    // Local state to manage form inputs before updating URL
    const [searchQuery, setSearchQuery] = useState(searchParams.get('keyword') || '');
    const [locationQuery, setLocationQuery] = useState(searchParams.get('location') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [isNearbyEnabled, setIsNearbyEnabled] = useState(searchParams.get('nearby') === 'true');
    const [isMapVisible, setIsMapVisible] = useState(searchParams.get('map') === 'true');
    const [withPromotionsOnly, setWithPromotionsOnly] = useState(searchParams.get('promotions') === 'true');
    const [topRatedOnly, setTopRatedOnly] = useState(searchParams.get('topRated') === 'true');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    // Sync state with URL params
    useEffect(() => {
        setSearchQuery(searchParams.get('keyword') || '');
        setLocationQuery(searchParams.get('location') || '');
        setSelectedCategory(searchParams.get('category') || 'all');
        setIsNearbyEnabled(searchParams.get('nearby') === 'true');
        setIsMapVisible(searchParams.get('map') === 'true');
        setWithPromotionsOnly(searchParams.get('promotions') === 'true');
        setTopRatedOnly(searchParams.get('topRated') === 'true');
    }, [searchParams]);

    const updateUrl = useCallback((params: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                newParams.set(key, value);
            } else {
                newParams.delete(key);
            }
        });
        router.push(`/search?${newParams.toString()}`, { scroll: false });
    }, [router, searchParams]);

    const handleMainSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateUrl({ keyword: searchQuery || null });
        if (user && db && searchQuery) logActivity(db, user.uid, 'location_search', { query: searchQuery });
    };

    const handleClearSearch = () => {
        updateUrl({ keyword: null, category: null, location: null, nearby: null, promotions: null, topRated: null });
    };

    const handleCategorySelect = (categoryId: string) => {
        const newCategory = categoryId === 'all' ? null : categoryId;
        updateUrl({ category: newCategory });
        if (user && db && newCategory) logActivity(db, user.uid, 'category_browse', { categoryId });
    };

    const handlePromotionsToggle = (checked: boolean) => {
        updateUrl({ promotions: checked ? 'true' : null });
    };

    const handleTopRatedToggle = (checked: boolean) => {
        updateUrl({ topRated: checked ? 'true' : null });
    };
    
    const handleUseCurrentLocation = async (checked: boolean) => {
        if (checked) {
            const location = await getUserLocation();
            if (location) {
                updateUrl({ location: null, nearby: 'true' });
                toast({ title: "Location Found", description: "Showing results near you.", variant: "success" });
            } else {
                toast({ title: "Location Error", description: "Could not get your location.", variant: "destructive" });
            }
        } else {
            updateUrl({ nearby: null });
        }
    };
    
    const handleLocationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocationQuery(e.target.value);
        if (e.target.value.trim() && isNearbyEnabled) {
            updateUrl({ nearby: null });
        }
    }
    
    const handleLocationSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateUrl({ location: locationQuery || null, nearby: null });
    }

    const handleMapToggle = (checked: boolean) => {
        updateUrl({ map: checked ? 'true' : null });
    };

    return (
        <div className="w-full">
            <div className="pt-4">
                <form onSubmit={handleMainSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search for Services"
                        className="h-14 rounded-lg pl-12 pr-28 text-base border-border focus-visible:ring-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-[90px] top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                            onClick={handleClearSearch}
                        >
                            <span className="sr-only">Clear search</span>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                    <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-6" size="lg">
                        Search
                    </Button>
                </form>
            </div>

            <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="w-full pt-2">
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="around-me-toggle" checked={isNearbyEnabled} onCheckedChange={handleUseCurrentLocation} disabled={isLocationLoading} className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-primary" />
                            <Label htmlFor="around-me-toggle" className="flex items-center gap-2 cursor-pointer">
                                {isLocationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                Nearby
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="map-toggle" checked={isMapVisible} onCheckedChange={handleMapToggle} className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-primary" />
                            <Label htmlFor="map-toggle" className="flex items-center gap-2 cursor-pointer"><MapIcon className="h-4 w-4" />Map</Label>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <CollapsibleTrigger asChild>
                            <Button variant="default">Advanced Search</Button>
                        </CollapsibleTrigger>
                    </div>
                </div>
                <CollapsibleContent>
                    <div className="space-y-4 rounded-md border p-4 mt-2 bg-transparent">
                        <div className="space-y-2">
                            <Label>Filter by Category</Label>
                            <Select onValueChange={handleCategorySelect} value={selectedCategory}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select a category..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {allCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Separator style={{ backgroundColor: 'hsl(211, 100%, 92%)' }} />
                        <div className="space-y-2">
                            <Label htmlFor="location-search">Filter by Location</Label>
                            <form onSubmit={handleLocationSearchSubmit} className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="location-search"
                                    placeholder="e.g., Yishun, Orchard Road, 560123"
                                    className="pl-10 pr-24 bg-white"
                                    value={locationQuery}
                                    onChange={handleLocationSearchChange}
                                />
                                <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2">
                                    {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Location"}
                                </Button>
                            </form>
                        </div>
                        <Separator style={{ backgroundColor: 'hsl(211, 100%, 92%)' }} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <Switch id="promotions-toggle" checked={withPromotionsOnly} onCheckedChange={handlePromotionsToggle} className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-primary border-secondary" />
                                <Label htmlFor="promotions-toggle" className="flex items-center gap-2 cursor-pointer">
                                    Vendors with Promotions
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="top-rated-toggle" checked={topRatedOnly} onCheckedChange={handleTopRatedToggle} className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-primary border-secondary" />
                                <Label htmlFor="top-rated-toggle" className="flex items-center gap-2 cursor-pointer">
                                    Top Rated Vendors (4+)
                                </Label>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
            <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} className="mt-4" />
        </div>
    );
}
