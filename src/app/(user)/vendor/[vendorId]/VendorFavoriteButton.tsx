'use client';

import { useEffect, useState, useMemo } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Vendor, ZippUser } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth';
import { useSupabaseDoc } from '@/lib/supabase/hooks';
import { supabase } from '@/lib/supabase/client';

/**
 * Favorite button component that lets users save vendors to their favorites list.
 */
export default function VendorFavoriteButton({ vendor }: { vendor: Vendor }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState<boolean>(false);

  // Subscribe to user's profile to get their favorites list
  const userQuery = useMemo(
    () => user ? () => supabase.from('users').select('favourites').eq('uid', user.uid).single() : () => null,
    [user]
  );
  const { data: profile, isLoading: loadingProfile } = useSupabaseDoc<ZippUser>(userQuery);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({ title: 'Please log in to save favourites.', variant: 'destructive' });
      return;
    }
    
    if (loadingProfile || !profile) {
      toast({ title: 'Still loading profile — try again shortly.', variant: 'info' });
      return;
    }

    setSaving(true);
    const isCurrentlyFavorited = profile?.favourites?.includes(vendor.id) ?? false;

    try {
      // Fetch current favorites
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('favourites')
        .eq('uid', user.uid)
        .single();
      
      if (fetchError) throw fetchError;

      // Update favorites array
      let updatedFavourites: string[];
      if (isCurrentlyFavorited) {
        // Remove from favorites
        updatedFavourites = (currentUser.favourites || []).filter((id: string) => id !== vendor.id);
      } else {
        // Add to favorites
        updatedFavourites = [...(currentUser.favourites || []), vendor.id];
      }

      // Save back to database
      const { error: updateError } = await supabase
        .from('users')
        .update({ favourites: updatedFavourites })
        .eq('uid', user.uid);
      
      if (updateError) throw updateError;

      toast({ 
        title: isCurrentlyFavorited ? 'Removed from favourites' : 'Added to favourites', 
        variant: 'success' 
      });
    } catch (err) {
      console.error('Could not update favourites:', err);
      toast({ title: 'Could not update favourites.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile && !profile) {
    return <Skeleton className="h-8 w-8 rounded-lg" />;
  }

  const isFavorited = profile?.favourites?.includes(vendor.id) ?? false;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleFavorite}
      disabled={saving}
      className="p-0 h-5 w-5"
    >
      {saving ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-5 w-5 text-muted-foreground transition-all duration-200',
            isFavorited && 'fill-blue-500 text-blue-500'
          )}
        />
      )}
      <span className="sr-only">Toggle Favorite</span>
    </Button>
  );
}
