
// src/app/challenges/page.tsx
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserChallenges } from '@/hooks/use-user-challenges';
import type { Challenge } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, ChevronRight, CalendarDays, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContent } from '@/contexts/content-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import UserDropdownMenu from '@/components/user-dropdown-menu';
import { getCurrentTheme } from '@/lib/themes';

const ChallengeCardSkeleton = () => (
  <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/50 flex flex-col justify-between">
    <CardHeader>
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-3/4 mb-1" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-1/4" />
    </CardHeader>
    <CardContent className="flex-grow">
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-4 w-5/6 mb-1.5" />
      <Skeleton className="h-4 w-2/3" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);


export default function ChallengesPage() {
  const { allChallenges, isLoadingContent: isLoadingAppContextContent, contentError: appContextContentError } = useContent();
  const { user, loading: authLoading } = useAuth();
  const { hasStartedChallenge, isLoading } = useUserChallenges();
  const { preferences, isLoaded: preferencesLoaded } = useUserPreferences();
  const router = useRouter();

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'challenges_list_page' });
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const weeklyTheme = useMemo(() => getCurrentTheme(), []);
  
  const featuredChallenges = useMemo(() => {
    return allChallenges.filter(challenge => {
      const challengeText = `${challenge.name} ${challenge.description}`.toLowerCase();
      return weeklyTheme.keywords.some(keyword => challengeText.includes(keyword));
    });
  }, [allChallenges, weeklyTheme]);

  const regularChallenges = useMemo(() => {
    const featuredIds = new Set(featuredChallenges.map(c => c.id));
    return allChallenges.filter(challenge => !featuredIds.has(challenge.id));
  }, [allChallenges, featuredChallenges]);


  const navigateTo = (path: string, pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: 'challenges_page_interaction' });
    }
    router.push(path);
  };

  const handleChallengeClick = (challengeId: string, challengeName: string) => {
     if (analytics) {
       logEvent(analytics, 'challenge_card_clicked', { challenge_id: challengeId, challenge_name: challengeName });
     }
     router.push(`/challenges/${challengeId}`);
  };
  
  const ChallengeGrid = ({ challenges }: { challenges: Challenge[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {challenges.map((challenge: Challenge) => {
        const isStarted = hasStartedChallenge(challenge.id);
        return (
          <Card
            key={challenge.id}
            className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer flex flex-col justify-between"
            onClick={() => handleChallengeClick(challenge.id, challenge.name)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5"/>
                  {challenge.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                    {isStarted && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                    )}
                </div>
              </div>
              <CardDescription className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-1.5"/>
                {challenge.durationDays} Days
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">{challenge.description}</p>
            </CardContent>
            <CardFooter>
              <Button variant="primaryGradient" className="w-full">
                {isStarted ? "Continue Challenge" : "View Details"}
                 <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );

  if (authLoading || !user || isLoadingAppContextContent || !preferencesLoaded || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading challenges...</p>
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
            <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Spiritual Challenges</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Embark on a journey of growth.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserDropdownMenu />
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-8 animate-fade-in space-y-12">
        {appContextContentError && (
          <Alert variant="destructive" className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Loading Challenges</AlertTitle>
            <AlertDescription>{appContextContentError} Ensure 'challenges_meta' collection is populated in Firestore.</AlertDescription>
          </Alert>
        )}
        {(isLoadingAppContextContent && !preferencesLoaded && !appContextContentError && allChallenges.length > 0) && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: Math.min(3, allChallenges.length) }).map((_, index) => <ChallengeCardSkeleton key={`skeleton-${index}`} />)}
          </div>
        )}
        {!isLoadingAppContextContent && !appContextContentError && allChallenges.length === 0 && (
          <div className="text-center p-8">
            <Sparkles className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold text-primary mb-3">No Challenges Available Yet</h2>
            <p className="text-muted-foreground">
              Please check back later for new spiritual growth challenges, or ensure challenges are added to Firestore.
            </p>
          </div>
        )}
        
        {!isLoadingAppContextContent && !appContextContentError && allChallenges.length > 0 && (
          <>
            {featuredChallenges.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold tracking-tight mb-4 flex items-center gap-2">
                  <weeklyTheme.icon className="h-6 w-6 text-accent" />
                  Featured for '{weeklyTheme.name}' Week
                </h2>
                <ChallengeGrid challenges={featuredChallenges} />
              </section>
            )}

            {regularChallenges.length > 0 && (
              <section>
                 <h2 className="text-2xl font-semibold tracking-tight mb-4">
                  {featuredChallenges.length > 0 ? 'All Other Challenges' : 'All Challenges'}
                </h2>
                <ChallengeGrid challenges={regularChallenges} />
              </section>
            )}
          </>
        )}
      </main>

      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Daily Grace. Grow in your faith.
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
