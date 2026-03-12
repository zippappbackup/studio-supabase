'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useSupabaseCollection hook.
 * @template T Type of the document data.
 */
export interface UseSupabaseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: Error | null;      // Error object, or null.
}

/**
 * Type for a function that builds a Supabase query
 */
export type QueryBuilder<T> = () => PostgrestFilterBuilder<any, T, T[]> | null;

/**
 * React hook to subscribe to a Supabase table query in real-time.
 * 
 * @template T Type for the row data.
 * @param {QueryBuilder<T>} queryBuilder - Function that returns a Supabase query. Should be memoized.
 * @param {string[]} [realtimeFilter] - Optional filter for realtime updates (e.g., ['vendor_id=eq.123'])
 * @returns {UseSupabaseCollectionResult<T>} Object with data, isLoading, error.
 * 
 * @example
 * const query = useMemo(() => 
 *   supabase.from('vendors').select('*').eq('region', 'Singapore'),
 *   []
 * );
 * const { data, isLoading, error } = useSupabaseCollection(query);
 */
export function useSupabaseCollection<T = any>(
  queryBuilder: QueryBuilder<T>,
  options?: {
    realtime?: boolean;
    realtimeEvent?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  }
): UseSupabaseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const query = queryBuilder();
    
    if (!query) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Initial fetch
    const fetchData = async () => {
      try {
        const { data: results, error: fetchError } = await query;
        
        if (fetchError) {
          throw fetchError;
        }

        const formattedData = (results || []).map((item: any) => {
          // Try to find an ID field - could be 'id', 'vendor_id', 'user_id', etc.
          const id = item.id || item.vendor_id || item.user_id || item.category_id || 
                     item.offering_id || item.promotion_id || item.review_id || item.booking_id || 
                     item.order_id || item.feedback_id || item.uid || 'unknown';
          return { ...item, id: String(id) } as ResultItemType;
        });

        setData(formattedData);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up realtime subscription if enabled
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    if (options?.realtime) {
      // Extract table name from query (this is a simplified approach)
      // In production, you might want to pass table name explicitly
      const tableName = extractTableName(query);
      
      if (tableName) {
        channel = supabase
          .channel(`${tableName}_changes`)
          .on(
            'postgres_changes',
            {
              event: options.realtimeEvent || '*',
              schema: 'public',
              table: tableName,
            },
            () => {
              // Refetch data when changes occur
              fetchData();
            }
          )
          .subscribe();
      }
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryBuilder, options?.realtime, options?.realtimeEvent]);

  return { data, isLoading, error };
}

/**
 * Helper function to extract table name from Supabase query
 * This is a simplified implementation - in production you might want to pass table name explicitly
 */
function extractTableName(query: any): string | null {
  try {
    // Try to extract from the query URL
    const url = query.url?.toString() || '';
    const match = url.match(/\/rest\/v1\/([^?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
