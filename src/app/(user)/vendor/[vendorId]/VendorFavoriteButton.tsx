'use client';

import { useEffect, useState, useRef } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Firestore,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase'; // your helper that returns Firestore instance
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Vendor } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

/**
 * Robust favorite button + profile subscription that avoids race conditions.
 *
 * Important: this component directly listens to Firebase Auth to determine
 * when we have a final, non-anonymous user. That prevents the "early return"
 * race condition where an anonymous placeholder caused us to bail before
 * subscribing to the real user's Firestore profile.
 */
export default function VendorFavoriteButton({ vendor }: { vendor: Vendor }) {
  const db = useFirestore() as Firestore | undefined;
  const auth = getAuth();
  const { toast } = useToast();

  // local representation of auth user (null = signed out)
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  // Firestore profile doc (the canonical source for favourites)
  const [profile, setProfile] = useState<{ favourites?: string[] } | null>(null);

  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // keep unsubscribe refs so we can cleanup reliably
  const profileUnsubRef = useRef<(() => void) | null>(null);
  const authUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Listen to Firebase Auth directly — this catches anonymous -> logged-in transitions.
    const unsubAuth = onAuthStateChanged(
      auth,
      (user) => {
        // This callback runs on initial auth state and whenever it changes.
        // user may be null (signed out) or an anonymous placeholder initially.
        setAuthUser(user);
        // When auth changes, we will set up (or tear down) the profile snapshot below.
      },
      (err) => {
        console.error('onAuthStateChanged error', err);
      }
    );

    authUnsubRef.current = unsubAuth;
    return () => {
      // cleanup auth listener if component unmounts
      if (authUnsubRef.current) authUnsubRef.current();
    };
    // Note: we intentionally *do not* include `db` in this effect dependency.
    // This effect only manages auth state subscription lifetime.
  }, [auth]);

  useEffect(() => {
    // This effect handles subscribing to the user's Firestore profile.
    // It depends on `authUser` and `db`.

    // First, clean up any *previous* profile subscription.
    // This is critical to prevent leaks when the user logs in/out.
    if (profileUnsubRef.current) {
      profileUnsubRef.current();
      profileUnsubRef.current = null;
    }

    if (!db || !authUser || authUser.isAnonymous) {
      // If we don't have a real, signed-in user, we can't get a profile.
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    // We have a real user, so try to get their profile doc.
    const profileRef = doc(db, 'users', authUser.uid);
    setLoadingProfile(true);

    const unsubProfile = onSnapshot(
      profileRef,
      (snapshot) => {
        setProfile(snapshot.data() as { favourites?: string[] } | null);
        setLoadingProfile(false);
      },
      (err) => {
        console.error('Error fetching user profile snapshot:', err);
        setLoadingProfile(false);
      }
    );

    // Store the new unsubscribe function so we can clean it up next time.
    profileUnsubRef.current = unsubProfile;

    return () => {
      // Final cleanup on component unmount
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
      }
    };
  }, [db, authUser]); // This effect re-runs when the user or db changes.


  const handleToggleFavorite = async () => {
    if (!db) {
      toast({ title: 'Database not ready.', variant: 'destructive' });
      return;
    }
    if (!authUser || authUser.isAnonymous) {
      toast({ title: 'Please log in to save favourites.', variant: 'destructive' });
      return;
    }
    if (loadingProfile || !profile) {
        toast({ title: 'Still loading profile — try again shortly.', variant: 'info' });
        return;
    }

    setSaving(true);
    const userRef = doc(db, 'users', authUser.uid);
    const isCurrentlyFavorited = profile?.favourites?.includes(vendor.id) ?? false;

    try {
      if (isCurrentlyFavorited) {
        await updateDoc(userRef, { favourites: arrayRemove(vendor.id) });
        toast({ title: 'Removed from favourites', variant: 'success' });
      } else {
        await updateDoc(userRef, { favourites: arrayUnion(vendor.id) });
        toast({ title: 'Added to favourites', variant: 'success' });
      }
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
