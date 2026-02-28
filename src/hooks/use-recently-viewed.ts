
'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'zipp_recently_viewed';
const MAX_ITEMS = 10; // Store up to 10 recent items

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on initial client-side render
  useEffect(() => {
    try {
      const storedItems = window.localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setRecentlyViewed(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Failed to parse recently viewed items from localStorage', error);
    }
    setIsInitialized(true);
  }, []);

  const addRecentlyViewed = useCallback((vendorId: string) => {
    // This function can only run after initialization
    if (!isInitialized) return;

    try {
      setRecentlyViewed(prevItems => {
        // 1. Remove the id if it already exists to move it to the front
        const filteredItems = prevItems.filter(id => id !== vendorId);
        
        // 2. Add the new id to the beginning of the array
        const newItems = [vendorId, ...filteredItems];
        
        // 3. Trim the array to the maximum length
        const trimmedItems = newItems.slice(0, MAX_ITEMS);
        
        // 4. Update localStorage
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedItems));
        
        return trimmedItems;
      });
    } catch (error) {
      console.error('Failed to save recently viewed item to localStorage', error);
    }
  }, [isInitialized]);

  return { recentlyViewed, addRecentlyViewed, isInitialized };
}
