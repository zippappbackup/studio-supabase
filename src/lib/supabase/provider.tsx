'use client'

// ============================================================================
// SUPABASE PROVIDER
// Replaces: @/firebase/client-provider and provides Supabase context
// ============================================================================

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './client'

type SupabaseContextType = {
  user: User | null
  isLoading: boolean
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  isLoading: true,
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session only - auth.tsx handles all auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })
  }, [])

  return (
    <SupabaseContext.Provider value={{ user, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  )
}

// Hook to use Supabase context
export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within SupabaseProvider')
  }
  return context
}

// Hook to get current user (convenience)
export function useUser() {
  const { user } = useSupabase()
  return user
}
