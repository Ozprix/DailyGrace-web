
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useToast } from '@/hooks/use-toast';
import { db, analytics } from '@/lib/firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import type { Favorite } from '@/types';

export function useFavorites() {
  const { user } = useAuth();
  const { preferences, isLoaded: preferencesLoaded } = useUserPreferences();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoaded(false);
      if (user && preferencesLoaded) {
        // For logged-in users, favorites are stored in their user_preferences document
        const favoriteVerseIds = preferences.favoriteVerseIds || [];
        setFavorites(favoriteVerseIds.map((id: string) => ({ id, type: 'verse', addedAt: new Date() })));
      }
      setIsLoaded(true);
    };

    loadFavorites();
  }, [user, preferencesLoaded, preferences.favoriteVerseIds]);

  const toggleFavorite = useCallback(async (id: string, type: 'verse' | 'devotional' = 'verse') => {
    if (!user || !preferencesLoaded) {
      toast({ title: "Please log in to save favorites." });
      return;
    }

    const isCurrentlyFavorite = favorites.some(f => f.id === id);

    const optimisticFavorites = isCurrentlyFavorite
      ? favorites.filter(f => f.id !== id)
      : [...favorites, { id, type, addedAt: new Date() }];
    
    setFavorites(optimisticFavorites); // Optimistic UI update

    if (analytics) {
      logEvent(analytics, 'favorite_toggled', {
        item_id: id,
        action: isCurrentlyFavorite ? 'removed' : 'added',
        subscription_status: 'all_access', // No longer gated
      });
    }

    const userPrefsDocRef = doc(db, 'user_preferences', user.uid);
    try {
      await updateDoc(userPrefsDocRef, {
        favoriteVerseIds: isCurrentlyFavorite ? arrayRemove(id) : arrayUnion(id)
      });
    } catch (error) {
      console.error("Failed to update favorites in Firestore:", error);
      setFavorites(favorites); // Revert optimistic update on failure
      toast({ title: "Update Failed", description: "Could not sync your favorites with the cloud.", variant: "destructive" });
    }
  }, [favorites, user, preferences, preferencesLoaded, toast]);

  const isFavorite = useCallback((id: string) => {
    return favorites.some(f => f.id === id);
  }, [favorites]);

  const favoriteIds = favorites.map(f => f.id);

  return { 
    isFavorite, 
    toggleFavorite, 
    isLoaded, 
    favorites,
    favoriteIds,
    currentFavoriteCount: favorites.length, 
    maxFavorites: Infinity // All users have unlimited favorites now
  };
}
