
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { collection, getDocs, query, where, doc, documentId, getDoc, limit } from 'firebase/firestore';
import { useFirestore, initializeFirebase } from '@/firebase';
import type { Category, Promotion, Vendor } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
  const db = useFirestore();
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
      if (!db || isSyncing.current) {
        if(isSyncing.current) console.log("AppCacheProvider: Data sync already initiated. Skipping.");
        return;
      }
      isSyncing.current = true;

      console.log("AppCacheProvider: Starting data sync process.");
      setError(null);
      
      try {
        const cachedItem = localStorage.getItem(VENDOR_CACHE_KEY);
        let cachedData = null;
        if (cachedItem) {
          try {
            cachedData = JSON.parse(cachedItem);
          } catch (e) {
            console.error("Error parsing localStorage data. Clearing cache.", e);
            localStorage.removeItem(VENDOR_CACHE_KEY);
          }
        }
        
        let currentVersion = null;

        if (cachedData?.data) {
          setVendorDataset(cachedData.data);
          setIsVendorDataReady(true);
          currentVersion = cachedData.version;
        }

        const { firebaseApp } = initializeFirebase();
        const functions = getFunctions(firebaseApp, 'us-central1');
        const getVendorDatasetFn = httpsCallable(functions, 'getVendorDataset');

        const result: any = await getVendorDatasetFn({ version: currentVersion });

        const { version: newVersion, data: functionData, status } = result.data;

        if (status === 'not-modified') {
          if (!isVendorDataReady) setIsVendorDataReady(true);
          isSyncing.current = false;
          return;
        }

        if (!newVersion || !functionData?.vendors) {
          throw new Error("Invalid data structure received from Cloud Function.");
        }
        
        const cacheEntry = {
            version: newVersion,
            data: functionData.vendors,
            timestamp: Date.now()
        };
        localStorage.setItem(VENDOR_CACHE_KEY, JSON.stringify(cacheEntry));

        setVendorDataset(functionData.vendors);
        
        if (!isVendorDataReady) setIsVendorDataReady(true);

      } catch (err: any) {
        const errorMessage = err.message || "An unknown error occurred during sync.";
        setError(errorMessage);
        if (!isVendorDataReady) setIsVendorDataReady(true); // Still allow app to proceed if possible
      } finally {
        isSyncing.current = false;
      }
    }

    async function syncCategories() {
      if (!db) return;

      try {
        const cachedCategories = localStorage.getItem(CATEGORY_CACHE_KEY);
        if (cachedCategories) {
          const { data, timestamp } = JSON.parse(cachedCategories);
          if (Date.now() - timestamp < CACHE_TTL) {
            setCategories(data);
            return;
          }
        }

        const catSnap = await getDocs(query(collection(db, 'categories')));
        // Replace hyphenated Firestore ID with the correct `name` field for use throughout the app.
        const catData = catSnap.docs.map(d => {
            const data = d.data() as Omit<Category, 'id'>;
            return { ...data, id: data.name } as Category;
        });
        
        setCategories(catData);
        localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify({ data: catData, timestamp: Date.now() }));

      } catch (error) {
          console.error("Failed to initialize categories cache:", error);
      }
    }

    async function syncZippHighlights() {
      if (!db) return;
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

        const highlightsRef = doc(db, 'zippHighlights', 'singleton');
        const highlightsSnap = await getDoc(highlightsRef);
        
        if (highlightsSnap.exists()) {
          const highlightsData = (highlightsSnap.data() as { vendors: Vendor[] }).vendors;
          setZippHighlights(highlightsData);
          localStorage.setItem(HIGHLIGHTS_CACHE_KEY, JSON.stringify({ data: highlightsData, timestamp: Date.now() }));
        } else {
            setZippHighlights([]);
        }
      } catch(error) {
        console.error("Failed to fetch Zipp Highlights:", error);
      } finally {
        setIsHighlightsLoading(false);
      }
    }
    
    syncVendorDataset();
    syncCategories();
    syncZippHighlights();
  }, [db]);

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
    
    if (db) {
        try {
            const docRef = doc(db, 'vendors', vendorId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Vendor : null;
        } catch (error) {
            console.error("getVendorFromSnapshot: Direct Firestore read failed.", error);
            return null;
        }
    }
    
    return null;
  }, [db, vendorDataset]);
  
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
