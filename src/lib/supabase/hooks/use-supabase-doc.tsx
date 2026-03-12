'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useSupabaseDoc hook.
 * @template T Type of the document data.
 */
export interface UseSupabaseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: Error | null;      // Error object, or null.
}

/**
 * Type for a function that builds a Supabase query for a single row
 */
export type DocQueryBuilder<T> = () => PostgrestFilterBuilder<any, T, T> | null;

/**
 * React hook to subscribe to a single Supabase row in real-time.
 * 
 * @template T Type for the row data.
 * @param {DocQueryBuilder<T>} queryBuilder - Function that returns a Supabase single() query. Should be memoized.
 * @param {Object} options - Optional configuration
 * @returns {UseSupabaseDocResult<T>} Object with data, isLoading, error.
 * 
 * @example
 * const query = useMemo(() => 
 *   supabase.from('vendors').select('*').eq('vendor_id', id).single(),
 *   [id]
 * );
 * const { data, isLoading, error } = useSupabaseDoc(query);
 */
export function useSupabaseDoc<T = any>(
  queryBuilder: DocQueryBuilder<T>,
  options?: {
    realtime?: boolean;
    tableName?: string;
  }
): UseSupabaseDocResult<T> {
  type StateDataType = WithId<T> | null;

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
        const { data: result, error: fetchError } = await query;
        
        if (fetchError) {
          throw fetchError;
        }

        if (result) {
          // Try to find an ID field - could be 'id', 'vendor_id', 'user_id', etc.
          const id = (result as any).id || (result as any).vendor_id || (result as any).user_id || 
                     (result as any).category_id || (result as any).offering_id || 
                     (result as any).promotion_id || (result as any).review_id || 
                     (result as any).booking_id || (result as any).order_id || 
                     (result as any).feedback_id || (result as any).uid || 'unknown';
          
          setData({ ...result, id: String(id) } as WithId<T>);
        } else {
          setData(null);
        }
        
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
    
    if (options?.realtime && options?.tableName) {
      channel = supabase
        .channel(`${options.tableName}_single_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: options.tableName,
          },
          () => {
            // Refetch data when changes occur
            fetchData();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryBuilder, options?.realtime, options?.tableName]);

  return { data, isLoading, error };
}
