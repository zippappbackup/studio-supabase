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

export default function VendorFavoriteButton({ vendor }: { vendor: Vendor }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState<boolean>(false);
  // Local state so the heart updates instantly on tap without waiting for a re-fetch
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const userQuery = useMemo(
    () => user ? () => supabase.from('users').select('favourites').eq('uid', user.uid).single() : () => null,
    [user]
  );
  const { data: profile, isLoading: loadingProfile } = useSupabaseDoc<ZippUser>(userQuery);

  // Sync local state from fetched profile on initial load
  useEffect(() => {
    if (profile && !isInitialized) {
      setIsFavorited(profile?.favourites?.includes(vendor.id) ?? false);
      setIsInitialized(true);
    }
  }, [profile, vendor.id, isInitialized]);

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
    // Optimistically update the heart immediately
    const newFavoritedState = !isFavorited;
    setIsFavorited(newFavoritedState);

    try {
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('favourites')
        .eq('uid', user.uid)
        .single();

      if (fetchError) throw fetchError;

      const updatedFavourites = newFavoritedState
        ? [...(currentUser.favourites || []), vendor.id]
        : (currentUser.favourites || []).filter((id: string) => id !== vendor.id);

      const { error: updateError } = await supabase
        .from('users')
        .update({ favourites: updatedFavourites })
        .eq('uid', user.uid);

      if (updateError) throw updateError;

      toast({
        title: newFavoritedState ? 'Added to favourites' : 'Removed from favourites',
        variant: 'success',
      });
    } catch (err) {
      // Revert optimistic update on failure
      setIsFavorited(!newFavoritedState);
      console.error('Could not update favourites:', err);
      toast({ title: 'Could not update favourites.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile && !isInitialized) {
    return <Skeleton className="h-8 w-8 rounded-lg" />;
  }

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
