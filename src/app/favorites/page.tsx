
// src/app/favorites/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useFavorites } from '@/hooks/use-favorites';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import type { DevotionalContent, BibleVerse, Favorite } from '@/types';
import { generateDevotionalMessage } from '@/ai/flows/generate-devotional-message';
import { generatePrayerPoint } from '@/ai/flows/generate-prayer-point';
import { DevotionalCard } from '@/components/devotional-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Terminal, ArrowLeft, Heart, Loader2, WifiOff } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { useContent } from '@/contexts/content-context';
import UserDropdownMenu from '@/components/user-dropdown-menu';
import { cacheDevotionals, getCachedData } from '@/services/offline-sync.service';
import { useToast } from '@/hooks/use-toast';

const MAX_DISPLAY_SKELETONS = 3;

export default function FavoritesPage() {
  const { allBibleVerses, isLoadingContent: isLoadingAppContextContent, contentError: appContextContentError } = useContent();
  const { user, loading: authLoading } = useAuth();
  const { favorites, isLoaded: favoritesLoaded } = useFavorites();
  const { preferences: userPreferences, isLoaded: preferencesLoadedHook } = useUserPreferences();
  const router = useRouter();
  const { toast } = useToast();

  const [favoritedDevotionals, setFavoritedDevotionals] = useState<DevotionalContent[]>([]);
  const [isLoadingDevotionalContent, setIsLoadingDevotionalContent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setIsOffline(!navigator.onLine);
    }
  }, []);

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'favorites_page' });
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchFavoriteDevotionals = async () => {
      if (!user || !favoritesLoaded || !preferencesLoadedHook || isLoadingAppContextContent) {
        if (appContextContentError) setError(appContextContentError);
        return;
      }

      setIsLoadingDevotionalContent(true);
      setError(null);

      const favoriteIds = new Set(favorites.map(f => f.id));

      if (favoriteIds.size === 0) {
        setIsLoadingDevotionalContent(false);
        setFavoritedDevotionals([]);
        return;
      }

      // Handle Offline First
      if (isOffline) {
        toast({ title: "You are offline", description: "Loading favorites from your device." });
        const cachedDevotionals = await getCachedData('devotionals');
        const offlineFavorites = cachedDevotionals.filter(d => favoriteIds.has(d.verse.id));
        setFavoritedDevotionals(offlineFavorites);
        setIsLoadingDevotionalContent(false);
        if(offlineFavorites.length < favoriteIds.size){
            setError("Some favorited devotionals are not available offline.");
        }
        return;
      }

      // Online Logic
      const favoritedVerseObjects = allBibleVerses.filter(verse => favoriteIds.has(verse.id));
      if (favoritedVerseObjects.length === 0) {
        setIsLoadingDevotionalContent(false);
        setFavoritedDevotionals([]);
        return;
      }
      
      setFavoritedDevotionals([]);
      const preferShortFormat = userPreferences.contentStyle === 'short';

      try {
        const devotionalPromises = favoritedVerseObjects.map(async (verse) => {
          const devotionalMsgOutput = await generateDevotionalMessage({ bibleVerse: verse.text, preferShortMessage: preferShortFormat });
          const prayerPointOutput = await generatePrayerPoint({ verse: verse.text, message: devotionalMsgOutput.message, preferShortPrayer: preferShortFormat });
          return {
            verse,
            message: devotionalMsgOutput.message,
            prayerPoint: prayerPointOutput.prayerPoint,
            themes: devotionalMsgOutput.themes || [],
          };
        });

        const results = await Promise.all(devotionalPromises);
        setFavoritedDevotionals(results);
        await cacheDevotionals(results); // Cache the results for offline use
      } catch (e: any) {
        console.error("Failed to generate devotional for favorites:", e);
        setError(`Failed to load favorited devotionals: ${e.message || "Please try again later."}`);
      } finally {
        setIsLoadingDevotionalContent(false);
      }
    };

    if (favoritesLoaded && preferencesLoadedHook && !isLoadingAppContextContent) {
      fetchFavoriteDevotionals();
    } else if (isLoadingAppContextContent) {
      setIsLoadingDevotionalContent(true);
    }
  }, [user, favorites, favoritesLoaded, preferencesLoadedHook, userPreferences.contentStyle, allBibleVerses, isLoadingAppContextContent, appContextContentError, isOffline, toast]);

  const navigateTo = (path: string, pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: 'favorites_page_interaction' });
    }
    router.push(path);
  };

  if (authLoading || !favoritesLoaded || !preferencesLoadedHook || isLoadingAppContextContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-foreground p-4">
         <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading favorites...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-foreground p-4">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigateTo('/', 'home_via_back_arrow')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">My Favorites</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Your cherished devotionals.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {isOffline && <span title="You are offline"><WifiOff className="h-5 w-5 text-muted-foreground" /></span>}
          <ThemeToggle />
          <UserDropdownMenu />
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-8 animate-fade-in">
        {appContextContentError && (
          <Alert variant="destructive" className="max-w-2xl mx-auto mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Loading App Content</AlertTitle>
            <AlertDescription>{appContextContentError}</AlertDescription>
          </Alert>
        )}
        {isLoadingDevotionalContent && favoritedDevotionals.length === 0 && favorites.length > 0 && !appContextContentError && (
          <div className="space-y-6">
            {Array.from({ length: Math.min(favorites.length, MAX_DISPLAY_SKELETONS) }).map((_, i) => (
              <div key={`fav-skeleton-${i}`} className="w-full max-w-2xl mx-auto space-y-4 p-6 border rounded-xl shadow-lg bg-card/80 backdrop-blur-sm">
                <Skeleton className="h-8 w-1/3 rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-6 w-1/4 rounded-md mt-4" />
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-6 w-1/4 rounded-md mt-4" />
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-6 w-1/2 rounded-md mt-4" />
              </div>
            ))}
            {favorites.length > MAX_DISPLAY_SKELETONS && (
              <p className="text-center text-muted-foreground mt-4">Loading more...</p>
            )}
          </div>
        )}
        {error && !isLoadingDevotionalContent && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Loading Favorites</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!isLoadingDevotionalContent && !error && favoritedDevotionals.length > 0 && !appContextContentError && (
          <div className="space-y-8">
            {favoritedDevotionals.map((devotional) => (
              <DevotionalCard key={devotional.verse.id} devotional={devotional} />
            ))}
          </div>
        )}
        {!isLoadingDevotionalContent && !error && favoritedDevotionals.length === 0 && !appContextContentError && (
          <div className="text-center max-w-md mx-auto p-8 bg-card/80 backdrop-blur-sm text-card-foreground rounded-xl shadow-lg">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold text-primary mb-3">No Favorites Yet</h2>
            <p className="text-muted-foreground mb-6">
              It looks like you haven't favorited any devotionals yet.
              Head back to the <Button variant="link" onClick={() => navigateTo('/', 'home_from_empty_favorites')} className="p-0 h-auto text-primary hover:underline font-medium">homepage</Button> to find today's inspiration and add it to your favorites!
            </p>
            <Button asChild variant="primaryGradient" onClick={() => navigateTo('/', 'home_from_empty_favorites_button')}>
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>
        )}
      </main>

      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Daily Grace. Cherish your moments of reflection.
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="text-xs text-muted-foreground">|</span>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
