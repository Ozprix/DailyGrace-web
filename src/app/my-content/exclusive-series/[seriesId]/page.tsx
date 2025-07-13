
// src/app/my-content/exclusive-series/[seriesId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useContent } from '@/contexts/content-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import type { ExclusiveDevotionalSeries, ExclusiveDevotionalDay } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Settings, Heart, LogOut, Sparkles, Edit3, Gift, Terminal, Loader2, Info, Puzzle, Lock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';

const ExclusiveSeriesSkeleton = () => (
  <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
    <CardHeader>
      <Skeleton className="h-8 w-3/4 mb-2" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-5/6 mt-1" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
    </CardContent>
  </Card>
);

export default function ExclusiveSeriesContentPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { getExclusiveSeriesById, isLoadingContent: isLoadingAppContextContent, contentError: appContextContentError } = useContent();
  const { preferences, isLoaded: preferencesLoaded } = useUserPreferences();
  const router = useRouter();
  const params = useParams();
  const seriesId = params.seriesId as string;

  const [series, setSeries] = useState<ExclusiveDevotionalSeries | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (analytics && seriesId) {
      logEvent(analytics, 'view_page', { page_name: 'exclusive_series_content_page', series_id: seriesId });
    }
  }, [seriesId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (seriesId && !isLoadingAppContextContent && preferencesLoaded) {
      if (appContextContentError) {
        setPageError(appContextContentError);
        setSeries(null);
        return;
      }
      const foundSeries = getExclusiveSeriesById(seriesId);
      if (foundSeries) {
        if (preferences.unlockedExclusiveSeriesIds?.includes(seriesId)) {
          setSeries(foundSeries);
          setAccessDenied(false);
          if (analytics) {
            logEvent(analytics, 'view_unlocked_exclusive_series', { series_id: seriesId, series_name: foundSeries.name });
          }
        } else {
          setSeries(null);
          setAccessDenied(true);
          if (analytics) {
            logEvent(analytics, 'access_denied_exclusive_series', { series_id: seriesId, series_name: foundSeries.name });
          }
        }
      } else {
        setSeries(null);
        setPageError("Exclusive series not found.");
         if (analytics) {
            logEvent(analytics, 'exclusive_series_not_found_on_content_page', { series_id: seriesId });
          }
      }
    }
  }, [seriesId, isLoadingAppContextContent, appContextContentError, getExclusiveSeriesById, preferencesLoaded, preferences.unlockedExclusiveSeriesIds, router]);


  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "DG";
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return email.substring(0, 2).toUpperCase();
  };

  const navigateTo = (path: string, pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: `exclusive_series_content_page_${seriesId}` });
    }
    router.push(path);
  };


  if (authLoading || isLoadingAppContextContent || !preferencesLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading exclusive content...</p>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><p>Redirecting to login...</p></div>;
  }
  
  const effectivePageError = pageError || appContextContentError;


  return (
    <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigateTo('/store', 'grace_store_page')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight line-clamp-1" title={series?.name || 'Exclusive Content'}>
              {series ? series.name : effectivePageError || accessDenied ? 'Access Issue' : 'Loading Series...'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9"><AvatarFallback>{getInitials(user.email)}</AvatarFallback></Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigateTo('/', 'home')} className="cursor-pointer">Home</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateTo('/store', 'grace_store_page')} className="cursor-pointer"><Gift className="mr-2 h-4 w-4" /><span>Grace Store</span></DropdownMenuItem>
                 <DropdownMenuItem onClick={() => navigateTo('/settings', 'settings')} className="cursor-pointer"><Settings className="mr-2 h-4 w-4" /><span>Settings</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-8">
        {(!series && !effectivePageError && !accessDenied) && <ExclusiveSeriesSkeleton />}

        {effectivePageError && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Loading Content</AlertTitle>
            <AlertDescription>{effectivePageError} Please try again or go back to the store.</AlertDescription>
             <Button onClick={() => navigateTo('/store', 'grace_store_page')} variant="link" className="p-0 h-auto mt-2 text-destructive-foreground hover:underline">
                Back to Grace Store
              </Button>
          </Alert>
        )}

        {accessDenied && !effectivePageError && (
          <Alert variant="default" className="max-w-2xl mx-auto bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700 text-amber-700 dark:text-amber-300">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold text-amber-700 dark:text-amber-300">Access Denied</AlertTitle>
            <AlertDescription className="dark:text-amber-400/90">
              You have not unlocked this exclusive series yet. Please visit the Grace Store to unlock it with your points.
            </AlertDescription>
            <Button onClick={() => navigateTo('/store', 'grace_store_page_from_access_denied')} variant="outline" size="sm" className="mt-3 border-amber-500 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-800">
                Go to Grace Store
            </Button>
          </Alert>
        )}

        {series && !effectivePageError && !accessDenied && (
          <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                <Gift className="h-6 w-6" /> {series.name}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground pt-1">{series.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold text-accent mb-3 mt-2">Daily Inspirations ({series.days.length} Days)</h3>
              {series.days.length > 0 ? (
                <Accordion type="single" collapsible className="w-full" defaultValue="day-1">
                  {series.days.map((day: ExclusiveDevotionalDay, index: number) => (
                    <AccordionItem value={`day-${day.dayNumber}`} key={index}>
                      <AccordionTrigger className="text-md hover:no-underline text-left">
                        Day {day.dayNumber}: {day.title}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pl-2 text-sm">
                        <div>
                            <h4 className="font-semibold text-primary/90 mb-1">Reflection:</h4>
                            <p className="text-foreground/80 whitespace-pre-line">{day.reflection}</p>
                        </div>
                         <div>
                            <h4 className="font-semibold text-primary/90 mb-1">Prayer Point:</h4>
                            <p className="text-foreground/80 whitespace-pre-line">{day.prayer}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-muted-foreground">Content for this series is not yet available.</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace. Enjoy your unlocked content.</p>
      </footer>
    </div>
  );
}
