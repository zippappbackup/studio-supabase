// ============================================================================
// SUPABASE CLIENT (Browser)
// Replaces: src/firebase/config.ts and src/firebase/index.ts
// ============================================================================

import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

/**
 * Get or create a Supabase client for browser-side operations
 * This is a singleton to avoid creating multiple instances
 */
export function getSupabaseBrowserClient() {
  if (client) {
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return client
}

/**
 * Convenience export for direct usage
 */
export const supabase = getSupabaseBrowserClient()
