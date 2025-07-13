
// src/app/challenges/[challengeId]/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useUserChallenges } from '@/hooks/use-user-challenges';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useJournal } from '@/hooks/use-journal';
import { generateChallengeDayContent } from '@/ai/flows/generate-challenge-day-content.genkit';
import type { GenerateChallengeDayContentOutput } from '@/ai/flows/generate-challenge-day-content.genkit';
import type { Challenge, ChallengeDay, BibleVerse, UserChallengeStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight, Bookmark, BookOpen, CalendarDays, CheckCircle, Edit3, Hourglass, Info, Loader2, Lock, MessageCircle, PlayCircle, Send, ShieldCheck, Sparkles, Target, Terminal } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useContent } from '@/contexts/content-context';
import UserDropdownMenu from '@/components/user-dropdown-menu';
import { differenceInCalendarDays } from 'date-fns';

const ChallengeProgressSkeleton = () => (
  <Card className="w-full max-w-3xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50 mb-6">
    <CardHeader className="pb-4">
      <Skeleton className="h-7 w-3/4 mb-2" />
      <Skeleton className="h-5 w-1/2" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-6 w-1/3 mb-2" />
        <div className="flex justify-between mb-1">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-2 w-full mb-2" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3 mt-3">

      <Skeleton className="h-5 w-1/3 mb-1.5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6 mb-3" />

      <Skeleton className="h-5 w-1/3 mb-1.5" />
      <Skeleton className="h-4 w-full" />

      <div className="p-3 bg-muted/50 rounded-md border border-border/50 mt-2">
        <Skeleton className="h-5 w-1/3 mb-1.5" />
        <Skeleton className="h-4 w-full" />
      </div>
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-1/3" />
    </CardFooter>
  </Card>
);


export default function ChallengeDetailPage() {
  const { getChallengeById, getVerseById, isLoadingContent: isLoadingAppContextContent, contentError: appContextContentError } = useContent();
  const { user, loading: authLoading } = useAuth();
  const {
    startChallenge,
    hasStartedChallenge,
    isLoadingUserChallenges,
    fetchChallengeProgress,
    getChallengeProgress,
    isFetchingProgress,
    markDayAsComplete,
    isUpdatingProgress
  } = useUserChallenges();
  const { preferences, isLoaded: preferencesLoaded } = useUserPreferences();
  const router = useRouter();
  const params = useParams();
  const challengeId = params.challengeId as string;
  const { toast } = useToast();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<UserChallengeStatus | null>(null);
  const [isProcessingStart, setIsProcessingStart] = useState(false);

  const [aiContent, setAiContent] = useState<GenerateChallengeDayContentOutput | null>(null);
  const [isLoadingAiContent, setIsLoadingAiContent] = useState(false);
  const [aiContentError, setAiContentError] = useState<string | null>(null);

  const { loadChallengeDayJournalEntry, saveChallengeDayJournalEntry, loadAllJournalEntriesForChallenge } = useJournal();
  const [challengeDayJournalText, setChallengeDayJournalText] = useState('');
  const [isLoadingChallengeDayJournal, setIsLoadingChallengeDayJournal] = useState(false);
  const [isSavingChallengeDayJournal, setIsSavingChallengeDayJournal] = useState(false);
  const [challengeDayJournalError, setChallengeDayJournalError] = useState<string | null>(null);
  const [hasLoadedChallengeDayJournal, setHasLoadedChallengeDayJournal] = useState(false);

  const [allChallengeDayJournals, setAllChallengeDayJournals] = useState<Map<number, string> | null>(null);
  const [isLoadingAllChallengeDayJournals, setIsLoadingAllChallengeDayJournals] = useState(false);


  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', {
        page_name: 'challenge_detail_page',
        challenge_id: challengeId,
      });
    }
  }, [challengeId]);

  useEffect(() => {
    if (challengeId && !isLoadingAppContextContent) {
      const foundChallenge = getChallengeById(challengeId);
      if (foundChallenge) {
        setChallenge(foundChallenge);
        if (analytics) {
          logEvent(analytics, 'view_challenge_details', {
            challenge_id: foundChallenge.id,
            challenge_name: foundChallenge.name,
          });
        }
      } else if (!appContextContentError) {
        setChallenge(null);
        if (analytics) {
          logEvent(analytics, 'challenge_not_found_detail_view', { challenge_id: challengeId });
        }
      }
    }
  }, [challengeId, isLoadingAppContextContent, getChallengeById, appContextContentError]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && challengeId && hasStartedChallenge(challengeId) && !challengeProgress) {
      const loadProgress = async () => {
        const progress = await fetchChallengeProgress(challengeId);
        setChallengeProgress(progress);
      };
      loadProgress();
    } else if (user && challengeId && !hasStartedChallenge(challengeId)) {
        setChallengeProgress(null);
    }
  }, [user, challengeId, hasStartedChallenge, fetchChallengeProgress, challengeProgress]);

  useEffect(() => {
    if (user && challengeId && hasStartedChallenge(challengeId)) {
      const fetchAllJournals = async () => {
        setIsLoadingAllChallengeDayJournals(true);
        const journalsMap = await loadAllJournalEntriesForChallenge(challengeId);
        const map = new Map<number, string>();
        journalsMap.forEach(entry => map.set(entry.dayNumber, entry.text));
        setAllChallengeDayJournals(map);
        setIsLoadingAllChallengeDayJournals(false);
      };
      fetchAllJournals();
    }
  }, [user, challengeId, loadAllJournalEntriesForChallenge, hasStartedChallenge]);


  const isChallengeStartedByHook = challenge ? hasStartedChallenge(challenge.id) : false;

  const currentDayData = (isChallengeStartedByHook && challengeProgress && challengeProgress.status === 'active' && challenge?.days)
    ? challenge.days.find(d => d.day === challengeProgress.currentDay)
    : null;

  let currentDayVerse: BibleVerse | undefined | null = null;
  if (currentDayData) {
      currentDayVerse = getVerseById(currentDayData.verseReference);
      if (currentDayData.verseReference && currentDayVerse === undefined && process.env.NODE_ENV === 'development') {
          console.warn(`[Challenge Day ${currentDayData.day} - ${challenge?.name}] Verse reference "${currentDayData.verseReference}" provided but not found.`);
      }
  }


  const isFreeUserAccessingPremium = false; // All features are free now


  useEffect(() => {
    if (currentDayData && preferencesLoaded && challengeProgress?.status === 'active' && !isFreeUserAccessingPremium) {
      setChallengeDayJournalText(''); 
      setHasLoadedChallengeDayJournal(false); 

      const fetchAiContent = async () => {
        setIsLoadingAiContent(true);
        setAiContentError(null);
        setAiContent(null);
        try {
          if (analytics) {
            logEvent(analytics, 'fetch_challenge_ai_content_start', {
              challenge_id: challengeId,
              day_number: currentDayData.day,
            });
          }
          const verseText = currentDayVerse ? currentDayVerse.text : undefined;
          const preferShortFormat = preferences.contentStyle === 'short';

          const result = await generateChallengeDayContent({
            challengeDayTitle: `Day ${currentDayData.day}: ${currentDayData.title}`,
            challengeDayBasePrompt: currentDayData.prompt,
            bibleVerseText: verseText,
            originalPrayerFocus: currentDayData.prayerFocus,
            preferShortContent: preferShortFormat,
          });
          setAiContent(result);
          if (analytics) {
            logEvent(analytics, 'fetch_challenge_ai_content_success', {
              challenge_id: challengeId,
              day_number: currentDayData.day,
            });
          }
        } catch (error: any) {
          console.error("Failed to generate AI content for challenge day:", error);
          setAiContentError(error.message || "Failed to load daily reflection.");
          if (analytics) {
            logEvent(analytics, 'fetch_challenge_ai_content_failed', {
              challenge_id: challengeId,
              day_number: currentDayData.day,
              error_message: error.message,
            });
          }
        } finally {
          setIsLoadingAiContent(false);
        }
      };
      fetchAiContent();
    } else if (challengeProgress?.status !== 'active' || isFreeUserAccessingPremium) {
      setAiContent(null);
      setIsLoadingAiContent(false);
      setChallengeDayJournalText('');
      setHasLoadedChallengeDayJournal(false);
    }
  }, [currentDayData, preferencesLoaded, preferences?.contentStyle, preferences?.subscriptionStatus, currentDayVerse, challengeId, challengeProgress?.status, isFreeUserAccessingPremium]);

  useEffect(() => {
    if (user && challengeId && currentDayData && challengeProgress?.status === 'active' && !hasLoadedChallengeDayJournal && !isLoadingAiContent && !isFreeUserAccessingPremium) {
      const fetchJournal = async () => {
        setIsLoadingChallengeDayJournal(true);
        setChallengeDayJournalError(null);
        const text = await loadChallengeDayJournalEntry(challengeId, currentDayData.day);
        setChallengeDayJournalText(text || '');
        setHasLoadedChallengeDayJournal(true);
        setIsLoadingChallengeDayJournal(false);
      };
      fetchJournal();
    } else if (challengeProgress?.status !== 'active' || isFreeUserAccessingPremium) {
      setChallengeDayJournalText('');
      setHasLoadedChallengeDayJournal(false);
    }
  }, [user, challengeId, currentDayData, challengeProgress?.status, loadChallengeDayJournalEntry, hasLoadedChallengeDayJournal, isLoadingAiContent, isFreeUserAccessingPremium]);


  const navigateTo = (path: string, pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: 'challenge_detail_page_interaction' });
    }
    router.push(path);
  };

  const handleStartChallengeClick = async () => {
    if (!challenge || !user || isFreeUserAccessingPremium) return;
    setIsProcessingStart(true);
    if (analytics) {
      logEvent(analytics, 'start_challenge_clicked', { challenge_id: challenge.id, challenge_name: challenge.name });
    }
    const success = await startChallenge(challenge.id, challenge.name);
    if (success) {
      const progress = await fetchChallengeProgress(challenge.id);
      setChallengeProgress(progress);
      const journals = await loadAllJournalEntriesForChallenge(challenge.id);
      const map = new Map<number, string>();
      journals.forEach(entry => map.set(entry.dayNumber, entry.text));
      setAllChallengeDayJournals(map);

    } else {
      console.error("Failed to start challenge from UI");
    }
    setIsProcessingStart(false);
  };

  const handleMarkDayComplete = async () => {
    if (!challengeId || !challengeProgress || challengeProgress.status !== 'active' || isFreeUserAccessingPremium) return;

    const success = await markDayAsComplete(challengeId);
    if (success) {
      const updatedProgress = await fetchChallengeProgress(challengeId);
      setChallengeProgress(updatedProgress);
    } else {
      console.error("Failed to mark day as complete from UI");
    }
  };

  const handleSaveChallengeDayJournal = async () => {
    if (!user || !challengeId || !currentDayData || challengeProgress?.status !== 'active' || isFreeUserAccessingPremium) {
      toast({ title: "Error", description: "Cannot save journal entry at this time.", variant: "destructive" });
      return;
    }
    setIsSavingChallengeDayJournal(true);
    setChallengeDayJournalError(null);
    const success = await saveChallengeDayJournalEntry(challengeId, currentDayData.day, challengeDayJournalText);
    if (success) {
      toast({ title: "Journal Saved!", description: `Your reflection for Day ${currentDayData.day} has been saved.` });
      setAllChallengeDayJournals(prevMap => {
        const newMap = new Map(prevMap);
        newMap.set(currentDayData.day, challengeDayJournalText);
        return newMap;
      });
    } else {
      setChallengeDayJournalError("Failed to save journal entry.");
      toast({ title: "Save Failed", description: challengeDayJournalError || "Could not save your journal entry.", variant: "destructive" });
    }
    setIsSavingChallengeDayJournal(false);
  };


  if (authLoading || isLoadingAppContextContent || isLoadingUserChallenges || !preferencesLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading challenge details...</p>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><p>Redirecting to login...</p></div>;
  }
  
  if (appContextContentError) {
     return (
      <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
        <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigateTo('/challenges', 'challenges_via_back_arrow')} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Challenge Details</h1>
            </div>
          </div>
          <div className="flex items-center gap-2"><ThemeToggle /></div>
        </header>
        <main className="flex-grow w-full container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <Alert variant="destructive" className="max-w-lg">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Loading App Content</AlertTitle>
            <AlertDescription>
              {appContextContentError}
              <Button onClick={() => router.push('/challenges')} variant="link" className="p-0 h-auto ml-1 text-destructive-foreground hover:underline">
                Go back to challenges list.
              </Button>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }


  if (!challenge && !isLoadingAppContextContent && !appContextContentError) {
    return (
      <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
        <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigateTo('/challenges', 'challenges_via_back_arrow')} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Challenge Not Found</h1>
            </div>
          </div>
          <div className="flex items-center gap-2"><ThemeToggle /></div>
        </header>
        <main className="flex-grow w-full container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <Alert variant="destructive" className="max-w-lg">
            <Info className="h-4 w-4" />
            <AlertTitle>Oops!</AlertTitle>
            <AlertDescription>
              The challenge you are looking for could not be found. It might have been removed or the link is incorrect.
              Please ensure challenge data exists in the 'challenges_meta' collection in Firestore.
              <Button onClick={() => router.push('/challenges')} variant="link" className="p-0 h-auto ml-1 text-destructive-foreground hover:underline">
                Go back to challenges list.
              </Button>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }
  
  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const progressPercentage = (isChallengeStartedByHook && challengeProgress && challenge)
    ? (challengeProgress.completedDays.length / challenge.durationDays) * 100
    : 0;
  
  const daysSinceStart = challengeProgress?.startedAt ? differenceInCalendarDays(new Date(), challengeProgress.startedAt.toDate()) : -1;
  const maxDayUnlocked = daysSinceStart >= 0 ? daysSinceStart + 1 : 0;
  const canCompleteCurrentDay = challengeProgress?.status === 'active' && challengeProgress.currentDay <= maxDayUnlocked;

  return (
    <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigateTo('/challenges', 'challenges_via_back_arrow')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight line-clamp-1" title={challenge.name}>{challenge.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 flex items-center">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> {challenge.durationDays} Days of Growth
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserDropdownMenu />
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-8">
        {(isFetchingProgress && isChallengeStartedByHook && !challengeProgress) ? (
          <ChallengeProgressSkeleton />
        ) : (
        <Card className="w-full max-w-3xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-accent flex items-center gap-2">
                <Sparkles className="h-6 w-6" /> {challenge.name}
              </CardTitle>
              {!isChallengeStartedByHook && (
                <Button
                  variant="primaryGradient"
                  onClick={handleStartChallengeClick}
                  className="ml-auto"
                  disabled={!user || isProcessingStart || isLoadingUserChallenges || isFreeUserAccessingPremium}
                  title={isFreeUserAccessingPremium ? "Upgrade to Premium to start this challenge" : "Start This Challenge"}
                >
                  {isProcessingStart ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : null}
                  {isProcessingStart ? "Starting..." : "Start This Challenge"}
                </Button>
              )}
            </div>
            <CardDescription className="mt-2 text-base text-muted-foreground">{challenge.description}</CardDescription>
             {isChallengeStartedByHook && challengeProgress && (
                <div className="mt-3 space-y-2">
                    <Badge
                        variant={challengeProgress.status === 'active' ? 'secondary' : 'default'}
                        className={`inline-flex items-center gap-1.5 ${challengeProgress.status === 'completed' ? 'bg-green-600 text-white dark:bg-green-500 dark:text-black hover:bg-green-700 dark:hover:bg-green-600' : ''}`}
                    >
                        {challengeProgress.status === 'active' ? <Hourglass className="h-3.5 w-3.5"/> : <CheckCircle className="h-3.5 w-3.5"/>}
                        Status: {challengeProgress.status === 'active' ? `Day ${challengeProgress.currentDay} of ${challenge.durationDays}` : 'Completed'}
                    </Badge>
                    <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>
                            {challengeProgress.completedDays.length} of {challenge.durationDays} days
                        </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                    </div>
                </div>
            )}
          </CardHeader>
          <CardContent>
            {isChallengeStartedByHook && challengeProgress?.status === 'completed' && (
                 <Alert variant="default" className="mb-6 bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-700 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <AlertTitle className="font-semibold text-green-700 dark:text-green-300">Challenge Completed!</AlertTitle>
                    <AlertDescription className="dark:text-green-400/90">
                        Congratulations on completing the "{challenge.name}" challenge!
                    </AlertDescription>
                </Alert>
            )}

            {isChallengeStartedByHook && challengeProgress && !canCompleteCurrentDay && challengeProgress.status === 'active' && (
                <Alert variant="default" className="mb-6">
                    <CalendarDays className="h-4 w-4" />
                    <AlertTitle>Patience is a Virtue!</AlertTitle>
                    <AlertDescription>
                        You've completed your challenge for today. Day {challengeProgress.currentDay} will unlock tomorrow. Keep up the great work!
                    </AlertDescription>
                </Alert>
            )}

            {isChallengeStartedByHook && challengeProgress && currentDayData && challengeProgress.status === 'active' && !isFreeUserAccessingPremium && (
              <Card className="mb-6 border-primary/50 bg-primary/5 shadow-md backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-primary flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" /> Today's Focus: Day {challengeProgress.currentDay} - {currentDayData.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {isLoadingAiContent && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground"> <MessageCircle className="h-4 w-4 animate-pulse"/> Generating reflection...</div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <div className="flex items-center gap-2 text-muted-foreground mt-3"> <Send className="h-4 w-4 animate-pulse"/> Generating prayer point...</div>
                      <Skeleton className="h-4 w-full" />
                    </div>
                  )}
                  {aiContentError && !isLoadingAiContent && (
                    <Alert variant="destructive">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Reflection Error</AlertTitle>
                      <AlertDescription>{aiContentError}</AlertDescription>
                    </Alert>
                  )}
                  {!isLoadingAiContent && aiContent && (
                    <>
                      <div>
                        <h4 className="font-semibold text-accent mb-1 flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> Reflection for Today:</h4>
                        <p className="text-foreground/90 whitespace-pre-line">{aiContent.reflection}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-accent mb-1 flex items-center gap-1.5"><Send className="h-4 w-4" /> Prayer for Today:</h4>
                        <p className="text-foreground/90 whitespace-pre-line">{aiContent.prayerPoint}</p>
                      </div>
                    </>
                  )}
                  {currentDayVerse && (
                    <div className="p-3 bg-muted/50 rounded-md border border-border/50 mt-3">
                      <p className="font-medium text-primary flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Scripture Foundation: {currentDayVerse.reference}</p>
                      <p className="italic text-foreground/80">"{currentDayVerse.text}"</p>
                    </div>
                  )}
                   {!aiContent && !isLoadingAiContent && !aiContentError && currentDayData.prompt && (
                     <div className="p-3 bg-muted/30 rounded-md border border-border/40 mt-2">
                        <p className="font-medium text-muted-foreground flex items-center gap-1.5"><Info className="h-4 w-4" /> Original Prompt:</p>
                        <p className="text-foreground/70">{currentDayData.prompt}</p>
                      </div>
                   )}
                    <div className="mt-6 pt-4 border-t border-border/50">
                        <h4 className="font-semibold text-accent mb-2 flex items-center gap-1.5"><Edit3 className="h-4 w-4" /> Your Journal for Day {currentDayData.day}:</h4>
                        {isLoadingChallengeDayJournal ? (
                            <div className="space-y-2">
                                <Skeleton className="h-20 w-full rounded-md" />
                                <Skeleton className="h-10 w-1/3 rounded-md" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Label htmlFor={`challenge-journal-${currentDayData.day}`} className="sr-only">Journal for Day {currentDayData.day}</Label>
                                <Textarea
                                    id={`challenge-journal-${currentDayData.day}`}
                                    placeholder="Write your reflections for today's challenge focus..."
                                    value={challengeDayJournalText}
                                    onChange={(e) => setChallengeDayJournalText(e.target.value)}
                                    rows={4}
                                    className="bg-background/70 focus:bg-background text-sm"
                                />
                                {challengeDayJournalError && (
                                  <p className="text-xs text-destructive">{challengeDayJournalError}</p>
                                )}
                                <Button
                                    onClick={handleSaveChallengeDayJournal}
                                    disabled={isSavingChallengeDayJournal || !challengeDayJournalText.trim()}
                                    size="sm"
                                    variant="secondary"
                                >
                                    {isSavingChallengeDayJournal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    {isSavingChallengeDayJournal ? 'Saving...' : 'Save Journal Entry'}
                                </Button>
                            </div>
                        )}
                    </div>

                </CardContent>
                <CardFooter>
                   <Button
                    variant="primaryGradient"
                    onClick={handleMarkDayComplete}
                    disabled={isUpdatingProgress || isLoadingAiContent || !canCompleteCurrentDay}
                    className="w-full sm:w-auto"
                    title={!canCompleteCurrentDay ? "Come back tomorrow to unlock the next day!" : `Mark Day ${challengeProgress.currentDay} Complete`}
                  >
                    {isUpdatingProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {isUpdatingProgress ? "Updating..." : `Mark Day ${challengeProgress.currentDay} Complete`}
                  </Button>
                </CardFooter>
              </Card>
            )}

            <h3 className="text-lg font-semibold text-primary mb-3 mt-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Full Challenge Plan ({challenge.durationDays} Days)
            </h3>
            {challenge.days.length > 0 ? (
              
                <Accordion type="single" collapsible className="w-full" 
                  defaultValue={isFreeUserAccessingPremium ? undefined : (currentDayData ? `day-${currentDayData.day}` : undefined)}>
                  {challenge.days.map((day: ChallengeDay, index: number) => {
                    const verse = getVerseById(day.verseReference);
                    if (day.verseReference && verse === undefined && process.env.NODE_ENV === 'development') {
                        console.warn(`[Challenge Plan - Day ${day.day} - ${challenge?.name}] Accordion: Verse reference "${day.verseReference}" provided but not found.`);
                    }
                    const isDayCompleted = challengeProgress?.completedDays.includes(day.day) ?? false;
                    const isCurrentActiveDay = challengeProgress?.status === 'active' && day.day === challengeProgress.currentDay;
                    const journalEntryForDay = allChallengeDayJournals?.get(day.day);
                    const hasJournalEntry = !!journalEntryForDay && journalEntryForDay.trim() !== '';

                    const isDayLocked = isChallengeStartedByHook && day.day > maxDayUnlocked;


                    let triggerClassName = "text-md hover:no-underline";
                    if (!isChallengeStartedByHook || isDayLocked) {
                        triggerClassName += " text-muted-foreground/70 cursor-not-allowed";
                    } else {
                        if (isDayCompleted) {
                            triggerClassName += " text-green-600 dark:text-green-400";
                        } else if (isCurrentActiveDay) {
                            triggerClassName += " text-primary font-semibold";
                        }
                    }

                    return (
                      <AccordionItem
                        value={`day-${day.day}`}
                        key={index}
                        disabled={!isChallengeStartedByHook || isDayLocked}
                      >
                        <AccordionTrigger className={triggerClassName} disabled={!isChallengeStartedByHook || isDayLocked}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              {!isChallengeStartedByHook ? <Lock className="h-5 w-5 text-muted-foreground" /> :
                               isDayLocked ? <Lock className="h-5 w-5 text-muted-foreground" /> :
                               isDayCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                               isCurrentActiveDay ? <PlayCircle className="h-5 w-5 text-primary" /> :
                               <CalendarDays className="h-5 w-5 text-muted-foreground/70" />
                              }
                              Day {day.day}: {day.title}
                            </div>
                            {hasJournalEntry && !isCurrentActiveDay && !isDayCompleted && (
                                <Bookmark className="h-4 w-4 text-muted-foreground/70 ml-2" title="Journal entry saved for this day" />
                            )}
                             {hasJournalEntry && isDayCompleted && (
                                <Bookmark className="h-4 w-4 text-green-500/70 ml-2" title="Journal entry saved for this day" />
                            )}
                             {hasJournalEntry && isCurrentActiveDay && (
                                <Bookmark className="h-4 w-4 text-primary/70 ml-2" title="Journal entry saved for this day" />
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pl-2 text-sm">
                         {!isChallengeStartedByHook ? (
                            <p className="text-muted-foreground italic py-2">Start this challenge to unlock the daily content.</p>
                         ) : isDayLocked ? (
                            <p className="text-muted-foreground italic py-2">This content unlocks on Day {day.day}. Come back then!</p>
                         ) : (
                           <>
                            <p className="text-muted-foreground">{day.prompt}</p>
                            {verse && (
                                <div className="p-3 bg-muted/50 rounded-md border border-border/50">
                                <p className="font-medium text-primary flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Scripture Focus: {verse.reference}</p>
                                <p className="italic text-foreground/80">"{verse.text}"</p>
                                </div>
                            )}
                            {day.prayerFocus && (
                                <div className="p-3 bg-accent/10 rounded-md border border-accent/30">
                                <p className="font-medium text-accent flex items-center gap-1.5"><Target className="h-4 w-4" /> Prayer Focus:</p>
                                <p className="text-foreground/80">{day.prayerFocus}</p>
                                </div>
                            )}
                            {isLoadingAllChallengeDayJournals && isChallengeStartedByHook && (
                                <div className="mt-3 p-3 bg-muted/20 rounded-md border border-border/30">
                                    <Skeleton className="h-4 w-1/3 mb-2" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-5/6" />
                                </div>
                            )}
                            {!isLoadingAllChallengeDayJournals && journalEntryForDay && isChallengeStartedByHook && (
                                <div className="mt-3 p-3 bg-muted/20 rounded-md border border-border/30">
                                    <h5 className="font-semibold text-muted-foreground mb-1 flex items-center gap-1.5"><Bookmark className="h-4 w-4"/> Your Journal for this Day:</h5>
                                    <p className="text-foreground/70 whitespace-pre-line text-xs">{journalEntryForDay}</p>
                                </div>
                            )}
                            {!isLoadingAllChallengeDayJournals && !journalEntryForDay && isChallengeStartedByHook && (
                                <p className="text-xs text-muted-foreground/70 italic mt-2 pl-1">(No journal entry for this day yet)</p>
                            )}
                           </>
                         )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              
            ) : (
              <p className="text-muted-foreground">Daily prompts for this challenge are not yet available.</p>
            )}
          </CardContent>
        </Card>
        )}
      </main>

      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Daily Grace. Embrace the challenge.
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
