'use client';

// ============================================================================
// AUTH CONTEXT & HOOK - Updated for Supabase
// Replaces: src/lib/auth.tsx (Firebase version)
// ============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { Address, ZippUser, Vendor } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { logActivity } from '@/lib/activity-logger';

interface AuthContextType {
  user: ZippUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (
    email: string,
    pass: string,
    data: {
      name: string;
      role: 'user' | 'vendor';
      phone: string;
      address: Address;
      companyName?: string;
      claimedVendorId?: string | null;
      lat?: number | null;
      lng?: number | null;
      dob: string | null;
      gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
      profession: string | null;
    }
  ) => Promise<{ redirectPath: string }>;
  logout: () => Promise<any>;
  sendResetEmail: (email: string) => Promise<{ success: boolean, error?: any }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean, error?: any }>;
  requestManualVerification: (vendor: Vendor) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ZippUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    };
    initAuth();

    // Only listen for explicit sign in/out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
      } else if (data) {
        setUser(data as ZippUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) throw error;
    
    // Log activity
    try {
      await logActivity('login', {});
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    router.push('/');
  };

  const signup = async (
    email: string,
    pass: string,
    data: {
      name: string;
      role: 'user' | 'vendor';
      phone: string;
      address: Address;
      companyName?: string;
      claimedVendorId?: string | null;
      dob: string | null;
      gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
      profession: string | null;
    }
  ): Promise<{ redirectPath: string }> => {
    const { claimedVendorId } = data;

    try {
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            name: data.name,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No user returned from signup');

      const userId = authData.user.id;
      let redirectPath = '/signup-success';

      // CASE 1: Claiming an existing vendor
      if (claimedVendorId) {
        const userDocData = {
          uid: userId,
          name: data.name,
          email,
          phone: data.phone,
          role: 'vendor',
          address_line1: data.address.line1,
          address_line2: data.address.line2,
          address_postal_code: data.address.postalCode,
          address_country: data.address.country,
          region: data.address.country,
          vendor_id: claimedVendorId,
          dob: null,
          gender: null,
          profession: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: userError } = await supabase
          .from('users')
          .insert(userDocData);

        if (userError) throw userError;

        // Update vendor with claimed status
        const { error: vendorError } = await supabase
          .from('vendors')
          .update({
            subscription_status: 'claimed_pending_approval',
            claimed_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('vendor_id', claimedVendorId);

        if (vendorError) throw vendorError;

        redirectPath = '/claim-success';

      // CASE 2: Creating a new vendor account (no existing business)
      } else if (data.role === 'vendor') {
        const userDocData = {
          uid: userId,
          name: data.name,
          email,
          phone: data.phone,
          role: 'vendor',
          region: data.address.country,
          address_line1: data.address.line1,
          address_line2: data.address.line2,
          address_postal_code: data.address.postalCode,
          address_country: data.address.country,
          dob: null,
          gender: null,
          profession: null,
          vendor_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: userError } = await supabase
          .from('users')
          .insert(userDocData);

        if (userError) throw userError;

        // Create new vendor record
        const vendorDocData = {
          vendor_id: userId,
          name: data.companyName || data.name,
          normalized_name: (data.companyName || data.name)?.toLowerCase(),
          email,
          phone: data.phone,
          address: `${data.address.line1}, Singapore ${data.address.postalCode}`,
          lat: data.lat || null,
          lng: data.lng || null,
          category_id: '',
          subscription_status: 'claimed_pending_approval',
          claimed_by: userId,
          modules_enabled: ['reviews', 'offerings', 'promotions'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          region: data.address.country,
          google_rating: 0,
          google_review_count: 0,
          zipp_rating: 0,
          zipp_review_count: 0,
          tags: [],
        };

        const { error: vendorError } = await supabase
          .from('vendors')
          .insert(vendorDocData);

        if (vendorError) throw vendorError;

        redirectPath = '/claim-success';

      // CASE 3: Regular user signup
      } else {
        const userDocData = {
          uid: userId,
          name: data.name,
          email,
          phone: data.phone,
          role: 'user',
          region: data.address.country,
          address_line1: data.address.line1,
          address_line2: data.address.line2,
          address_postal_code: data.address.postalCode,
          address_country: data.address.country,
          dob: data.dob,
          gender: data.gender,
          profession: data.profession,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: userError } = await supabase
          .from('users')
          .insert(userDocData);

        if (userError) throw userError;

        redirectPath = '/signup-success';
      }

      return { redirectPath };

    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        throw new Error('This email is already associated with another account. Please log in or use a different email.');
      }
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    setLoading(false);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const sendResetEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      let message = "An unknown error occurred.";
      if (error.message?.includes('User not found')) {
        message = "No account found with this email address.";
      }
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    try {
      // First verify current password by attempting to sign in
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser?.email) {
        return { success: false, error: "No authenticated user found." };
      }

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPass,
      });

      if (signInError) {
        return { success: false, error: "The current password you entered is incorrect." };
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (updateError) throw updateError;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "An unknown error occurred." };
    }
  };

  const requestManualVerification = async (vendor: Vendor) => {
    try {
      // Create a verification request record
      const { error } = await supabase
        .from('vendor_verification_requests')
        .insert({
          vendor_id: vendor.id,
          requested_by: user?.uid,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // You might want to also send an email notification to admins here
      // This would be done via a Supabase Edge Function

    } catch (error: any) {
      console.error('Error requesting verification:', error);
      throw new Error('Failed to submit verification request. Please try again.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        sendResetEmail,
        changePassword,
        requestManualVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
