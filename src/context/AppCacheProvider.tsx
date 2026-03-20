'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Category, Promotion, Vendor } from '@/lib/types';
import { useAuth } from '@/lib/auth';

const VENDOR_CACHE_KEY = 'zipp_vendor_dataset';
const CATEGORY_CACHE_KEY = 'zipp_category_cache';
const HIGHLIGHTS_CACHE_KEY = 'zipp_highlights_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

type Geolocation = [number, number];

interface AppCacheContextType {
  vendorDataset: Vendor[] | null;
  isVendorDataReady: boolean;
  getVendorFromSnapshot: (vendorId: string) => Promise<Vendor | null>;
  
  categories: Category[];
  zippHighlights: Vendor[] | null;
  isHighlightsLoading: boolean;
  
  userLocation: Geolocation | null;
  isLocationLoading: boolean;
  getUserLocation: () => Promise<Geolocation | null>;

  error: string | null;
}

const AppCacheContext = createContext<AppCacheContextType | undefined>(undefined);

export function AppCacheProvider({ children }: { children: ReactNode }) {
  const [vendorDataset, setVendorDataset] = useState<Vendor[] | null>(null);
  const [isVendorDataReady, setIsVendorDataReady] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [zippHighlights, setZippHighlights] = useState<Vendor[] | null>(null);
  const [isHighlightsLoading, setIsHighlightsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Geolocation | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    async function syncVendorDataset() {
      if (isSyncing.current) {
        console.log("AppCacheProvider: Data sync already initiated. Skipping.");
        return;
      }
      isSyncing.current = true;

      console.log("AppCacheProvider: Starting data sync process.");
      setError(null);
      
      try {
        // Check localStorage cache first
        const cachedItem = localStorage.getItem(VENDOR_CACHE_KEY);
        let cachedData = null;
        if (cachedItem) {
          try {
            cachedData = JSON.parse(cachedItem);
            // Check if cache is still valid (within 24 hours)
            if (cachedData?.timestamp && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
              setVendorDataset(cachedData.data);
              setIsVendorDataReady(true);
              isSyncing.current = false;
              console.log("AppCacheProvider: Using valid cached vendor data");
              return;
            }
          } catch (e) {
            console.error("Error parsing localStorage data. Clearing cache.", e);
            localStorage.removeItem(VENDOR_CACHE_KEY);
          }
        }
        
        // If cache is stale or doesn't exist, fetch from Supabase
        console.log("AppCacheProvider: Fetching fresh vendor data from Supabase");
        
        // Check if there's a pre-computed dataset in vendor_dataset_config table
        const { data: configData, error: configError } = await supabase
          .from('vendor_dataset_config')
          .select('*')
          .eq('config_key', 'global')
          .single();
        
        let vendors: Vendor[] = [];
        
        if (configData && configData.vendors && !configError) {
          // Use pre-computed dataset if available
          console.log("AppCacheProvider: Using pre-computed vendor dataset");
          vendors = configData.vendors;
        } else {
          // Fallback: Query all vendors directly
          console.log("AppCacheProvider: Fetching all vendors directly from database");
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('*')
            .order('name');
          
          if (vendorError) throw vendorError;
          
          // Transform to lean camelCase format for search (excludes heavy fields like reviews/photos)
          vendors = (vendorData || []).map(v => ({
            id: v.vendor_id,
            name: v.name,
            normalizedName: v.normalized_name,
            searchableName: v.searchable_name,
            categoryId: v.category_id,
            logoUrl: v.logo_url,
            description: v.description,
            region: v.region,
            lat: v.lat,
            lng: v.lng,
            address: v.address,
            phone: v.phone,
            email: v.email,
            website: v.website,
            googleRating: v.google_rating,
            googleReviewCount: v.google_review_count,
            zippRating: v.zipp_rating,
            zippReviewCount: v.zipp_review_count,
            tags: v.tags,
            matchedKeywords: v.matched_keywords,
            modulesEnabled: v.modules_enabled,
            subscriptionStatus: v.subscription_status,
            photos: (v.photos || []).slice(0, 1),
            promotions: v.promotions || [],
            businessStatus: v.business_status,
          })) as Vendor[];
        }
        
        // Cache the data
        const cacheEntry = {
          data: vendors,
          timestamp: Date.now()
        };
        localStorage.setItem(VENDOR_CACHE_KEY, JSON.stringify(cacheEntry));

        setVendorDataset(vendors);
        setIsVendorDataReady(true);
        console.log(`AppCacheProvider: Loaded ${vendors.length} vendors`);

      } catch (err: any) {
        const errorMessage = err.message || "An unknown error occurred during sync.";
        console.error("AppCacheProvider: Error syncing vendor dataset:", errorMessage);
        setError(errorMessage);
        setIsVendorDataReady(true); // Still allow app to proceed
      } finally {
        isSyncing.current = false;
      }
    }

    async function syncCategories() {
      try {
        const cachedCategories = localStorage.getItem(CATEGORY_CACHE_KEY);
        if (cachedCategories) {
          const { data, timestamp } = JSON.parse(cachedCategories);
          if (Date.now() - timestamp < CACHE_TTL) {
            setCategories(data);
            return;
          }
        }

        const { data: catData, error } = await supabase
          .from('categories')
          .select('*');
        
        if (error) throw error;

        // Replace hyphenated database ID with the correct `name` field for use throughout the app.
        const categoriesWithName = catData.map(cat => ({
          ...cat,
          id: cat.name
        })) as Category[];
        
        setCategories(categoriesWithName);
        localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify({ data: categoriesWithName, timestamp: Date.now() }));

      } catch (error) {
          console.error("Failed to initialize categories cache:", error);
      }
    }

    async function syncZippHighlights() {
      setIsHighlightsLoading(true);

      try {
        const cachedHighlights = localStorage.getItem(HIGHLIGHTS_CACHE_KEY);
        if (cachedHighlights) {
          const { data, timestamp } = JSON.parse(cachedHighlights);
          if (Date.now() - timestamp < CACHE_TTL) {
            setZippHighlights(data);
            setIsHighlightsLoading(false);
            return;
          }
        }

        const { data: highlightsData, error } = await supabase
          .from('zipp_highlights')
          .select('vendor_ids')
          .eq('singleton_key', 'singleton')
          .single();
        
        if (error) throw error;
        
        if (highlightsData?.vendor_ids && highlightsData.vendor_ids.length > 0) {
          // Fetch full vendor data for each highlighted vendor ID
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('*')
            .in('vendor_id', highlightsData.vendor_ids);
          
          if (vendorError) throw vendorError;
          
          const highlights = (vendorData || []).map(v => ({
            ...v,
            id: v.vendor_id,
            categoryId: v.category_id,
            logoUrl: v.logo_url,
            googleRating: v.google_rating,
            googleReviewCount: v.google_review_count,
            zippRating: v.zipp_rating,
            zippReviewCount: v.zipp_review_count,
            matchedKeywords: v.matched_keywords,
            subscriptionStatus: v.subscription_status,
          }));
          
          setZippHighlights(highlights);
          localStorage.setItem(HIGHLIGHTS_CACHE_KEY, JSON.stringify({ data: highlights, timestamp: Date.now() }));
        } else {
            setZippHighlights([]);
        }
      } catch(error) {
        console.error("Failed to fetch Zipp Highlights:", error);
        setZippHighlights([]);
      } finally {
        setIsHighlightsLoading(false);
      }
    }
    
    syncVendorDataset();
    syncCategories();
    syncZippHighlights();
  }, []);

  const getVendorFromSnapshot = useCallback(async (vendorId: string): Promise<Vendor | null> => {
    if (vendorDataset) {
        const vendorFromState = vendorDataset.find((v: Vendor) => v.id === vendorId);
        if (vendorFromState) {
          return vendorFromState;
        }
    }
    
    const cachedItem = localStorage.getItem(VENDOR_CACHE_KEY);
    if (cachedItem) {
        try {
            const cachedData = JSON.parse(cachedItem);
            if (cachedData?.data) {
                const vendorFromCache = cachedData.data.find((v: Vendor) => v.id === vendorId);
                if (vendorFromCache) {
                  return vendorFromCache;
                }
            }
        } catch (e) {
          console.error("getVendorFromSnapshot: Error parsing localStorage.", e);
        }
    }
    
    try {
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('vendor_id', vendorId)
          .single();
        
        if (error) throw error;
        return data ? { id: data.vendor_id, ...data } as Vendor : null;
    } catch (error) {
        console.error("getVendorFromSnapshot: Direct Supabase read failed.", error);
        return null;
    }
  }, [vendorDataset]);
  
  const getUserLocation = useCallback((): Promise<Geolocation | null> => {
    return new Promise((resolve) => {
        if (userLocation) {
            resolve(userLocation);
            return;
        }
        if (isLocationLoading) {
            resolve(null);
            return;
        }
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        setIsLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation: Geolocation = [position.coords.latitude, position.coords.longitude];
                setUserLocation(newLocation);
                setIsLocationLoading(false);
                resolve(newLocation);
            },
            (error) => {
                setIsLocationLoading(false);
                resolve(null);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    });
  }, [userLocation, isLocationLoading]);

  const value = useMemo(() => ({ 
      vendorDataset,
      isVendorDataReady,
      getVendorFromSnapshot,
      categories, 
      zippHighlights,
      isHighlightsLoading,
      userLocation,
      isLocationLoading,
      getUserLocation,
      error,
  }), [
      vendorDataset, 
      isVendorDataReady, 
      getVendorFromSnapshot, 
      categories, 
      zippHighlights,
      isHighlightsLoading,
      userLocation, 
      isLocationLoading, 
      getUserLocation, 
      error
  ]);

  return (
    <AppCacheContext.Provider value={value}>
      {children}
    </AppCacheContext.Provider>
  );
}

export function useAppCache() {
  const context = useContext(AppCacheContext);
  if (context === undefined) {
    throw new Error('useAppCache must be used within an AppCacheProvider');
  }
  return context;
}
