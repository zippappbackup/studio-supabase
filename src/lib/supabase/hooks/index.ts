/**
 * Supabase Hooks
 * 
 * These hooks provide a similar API to the Firebase hooks (useCollection, useDoc)
 * but work with Supabase instead.
 */

export { useSupabaseCollection } from './use-supabase-collection';
export { useSupabaseDoc } from './use-supabase-doc';

export type { UseSupabaseCollectionResult, WithId as CollectionWithId } from './use-supabase-collection';
export type { UseSupabaseDocResult, WithId as DocWithId } from './use-supabase-doc';
