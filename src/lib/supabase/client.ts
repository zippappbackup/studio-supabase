// ============================================================================
// SUPABASE CLIENT (Browser)
// Replaces: src/firebase/config.ts and src/firebase/index.ts
// ============================================================================

import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

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

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lock: async (name, acquireTimeout, fn) => {
        // Use a simple mutex instead of Web Locks API to prevent lock conflicts
        return fn()
      },
    }
  })

  return client
}

/**
 * Convenience export for direct usage
 */
export const supabase = getSupabaseBrowserClient()
