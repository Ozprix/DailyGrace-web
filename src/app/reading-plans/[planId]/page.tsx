
// src/app/reading-plans/[planId]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ReadingPlan, UserReadingProgress, Reading as ReadingType } from '@/types/reading-plan';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/auth-context';
import { useContent } from '@/contexts/content-context';
import { useReadingPlans } from '@/hooks/use-reading-plans'; // Import the new hook
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, BookOpen, Info, Lock, CalendarDays } from 'lucide-react';
import Header from '@/components/ui/header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

const ReadingTextSkeleton = () => (
  <div className="space-y-2 mt-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </div>
);

const IndividualReadingPlanPage: React.FC = () => {
  const params = useParams();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const router = useRouter();

  const { user } = useAuth();
  const { getVerseByReferenceOrId } = useContent();
  const { toast } = useToast();
  const { allReadingPlans, userProgressMap, isLoading, startReadingPlan, updateProgress } = useReadingPlans();

  const [readingPlan, setReadingPlan] = useState<ReadingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined);
  const [fetchedReadingTexts, setFetchedReadingTexts] = useState<Record<number, string>>({});
  const [loadingReadingTextId, setLoadingReadingTextId] = useState<number | null>(null);
  const [readingTextError, setReadingTextError] = useState<Record<number, string | null>>({});

  const userProgress = useMemo(() => userProgressMap.get(planId), [userProgressMap, planId]);

  useEffect(() => {
    if (!isLoading) {
      const plan = allReadingPlans.find(p => p.id === planId);
      if (plan) {
        setReadingPlan(plan);
        if (analytics) {
          logEvent(analytics, 'view_reading_plan_detail_page', { plan_id: planId, plan_name: plan.name });
        }
      } else {
        setError('Reading plan not found.');
        if (analytics) {
          logEvent(analytics, 'reading_plan_not_found_detail_page', { plan_id: planId });
        }
      }
    }
  }, [planId, allReadingPlans, isLoading]);


  const daysSinceStart = userProgress?.startedAt ? differenceInCalendarDays(new Date(), userProgress.startedAt.toDate()) : -1;
  const maxDayUnlocked = daysSinceStart >= 0 ? daysSinceStart + 1 : 0;


  const handleFetchReadingText = async (reading: ReadingType) => {
    const day = reading.day;
    if (fetchedReadingTexts[day] || loadingReadingTextId === day) return;

    setLoadingReadingTextId(day);
    setReadingTextError(prev => ({ ...prev, [day]: null }));
    
    const reference = reading.verseReference;
    if (!reference) {
        console.warn(`Missing verse reference for reading day: ${day}`);
        setReadingTextError(prev => ({ ...prev, [day]: 'Missing verse reference for this reading.' }));
        setLoadingReadingTextId(null);
        return;
    }
    
    if(analytics) logEvent(analytics, 'fetch_reading_plan_text_start', { plan_id: planId, reading_day: day, reference });

    try {
      const verseData = await getVerseByReferenceOrId(reference);
      if (verseData?.text) {
        setFetchedReadingTexts(prev => ({ ...prev, [day]: verseData.text }));
        if(analytics) logEvent(analytics, 'fetch_reading_plan_text_success', { plan_id: planId, reading_day: day, reference });
      } else {
        setReadingTextError(prev => ({ ...prev, [day]: `Could not load text for ${reference}.` }));
        if(analytics) logEvent(analytics, 'fetch_reading_plan_text_not_found', { plan_id: planId, reading_day: day, reference });
      }
    } catch (err) {
      console.error(`Error fetching text for ${reference}:`, err);
      setReadingTextError(prev => ({ ...prev, [day]: `Error loading text for ${reference}.` }));
      if(analytics) logEvent(analytics, 'fetch_reading_plan_text_failed', { plan_id: planId, reading_day: day, reference, error_message: (err as Error).message });
    } finally {
      setLoadingReadingTextId(null);
    }
  };

  const handleReadingCompleteToggle = async (day: number, isCompleted: boolean) => {
    if (!user || !readingPlan || !userProgress || !Array.isArray(readingPlan.readings)) {
      console.warn("User not logged in, reading plan not loaded, plan not started, or readings array missing. Cannot update progress.");
      return;
    }

    if (day > maxDayUnlocked) {
      toast({
          title: "Reading Locked",
          description: "This reading unlocks on its scheduled day. Keep up the great work!",
          variant: "default"
      });
      return;
    }

    const updatedCompletedDays = isCompleted
      ? [...(userProgress.completedDays || []), day]
      : (userProgress.completedDays || []).filter(d => d !== day);
    
    const allReadingsCompleted = readingPlan.readings.length > 0 && updatedCompletedDays.length === readingPlan.readings.length;
    const newStatus = allReadingsCompleted ? 'completed' : 'active';

    const progressUpdate: Partial<UserReadingProgress> = {
      completedDays: updatedCompletedDays,
      status: newStatus,
      lastDayCompletedAt: Timestamp.now(),
    };
    if (allReadingsCompleted) {
      progressUpdate.completedAt = Timestamp.now();
    }
    
    await updateProgress(userProgress.id, progressUpdate);
  };

  const handleStartPlan = async () => {
    await startReadingPlan(planId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={readingPlan?.name || 'Loading Reading Plan...'} />
        <main className="container mx-auto py-8 flex flex-col items-center justify-center flex-grow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading reading plan...</p>
        </main>
        <footer className="w-full text-center py-6 px-4 border-t border-border/60">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace.</p>
        </footer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Reading Plan Error" />
        <main className="container mx-auto py-8 text-center flex-grow">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/reading-plans')} className="mt-4">
            Back to Reading Plans
          </Button>
        </main>
        <footer className="w-full text-center py-6 px-4 border-t border-border/60">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace.</p>
        </footer>
      </div>
    );
  }

  if (!readingPlan) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Reading Plan Not Found" />
        <main className="container mx-auto py-8 text-center flex-grow">
           <Alert variant="default" className="max-w-md mx-auto">
            <Info className="h-4 w-4" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>This reading plan could not be found.</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/reading-plans')} className="mt-4">
            Back to Reading Plans
          </Button>
        </main>
        <footer className="w-full text-center py-6 px-4 border-t border-border/60">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace.</p>
        </footer>
      </div>
    );
  }

  const completedCount = userProgress?.completedDays?.length || 0;
  const totalCount = readingPlan && Array.isArray(readingPlan.readings) ? readingPlan.readings.length : 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={readingPlan.name} />
      <main className="container mx-auto py-8 flex flex-col items-center flex-grow">
        <Button variant="ghost" onClick={() => router.push('/reading-plans')} className="self-start mb-6 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> All Reading Plans
        </Button>
        <h1 className="text-3xl font-bold mb-2 text-primary text-center">{readingPlan.name}</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-xl">{readingPlan.description}</p>

        {user && (
          <div className="w-full max-w-lg mt-4 mb-8 p-4 border rounded-lg bg-card shadow">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{completedCount} of {totalCount} readings completed</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-primary/20" />
            {userProgress?.status === 'completed' && userProgress.completedAt && (
              <p className="text-sm text-green-600 font-semibold mt-2 text-center">
                Plan Completed on {userProgress.completedAt instanceof Timestamp ? userProgress.completedAt.toDate().toLocaleDateString() : new Date((userProgress.completedAt as any).seconds * 1000).toLocaleDateString()}!
              </p>
            )}
          </div>
        )}
        
        {userProgress && totalCount > 0 && completedCount === maxDayUnlocked && completedCount < totalCount && (
            <Alert variant="default" className="w-full max-w-lg mb-8">
                <CalendarDays className="h-4 w-4" />
                <AlertTitle>Well Done for Today!</AlertTitle>
                <AlertDescription>
                You have completed all available readings. The next reading will unlock tomorrow. Come back then to continue your journey!
                </AlertDescription>
            </Alert>
        )}

        {user && !userProgress && (
          <Button onClick={handleStartPlan} className="mt-4 mb-8" variant="primaryGradient">
            Start This Reading Plan
          </Button>
        )}
        
        <div className="w-full max-w-lg">
          <h2 className="text-2xl font-semibold mb-4 text-center text-accent">Readings:</h2>
          {(!readingPlan.readings || readingPlan.readings.length === 0) ? (
            <p className="text-muted-foreground text-center">No readings defined for this plan yet.</p>
          ) : (
            <Accordion 
              type="single" 
              collapsible 
              className="w-full"
              value={activeAccordionItem}
              onValueChange={(value) => {
                setActiveAccordionItem(value);
                if (value) {
                  const dayToFetch = parseInt(value.split('-')[1], 10);
                  const readingToFetch = readingPlan.readings.find(r => r.day === dayToFetch);
                  if (readingToFetch && userProgress) { 
                    handleFetchReadingText(readingToFetch);
                  }
                }
              }}
            >
              {readingPlan.readings.map((reading) => {
                  const isCompleted = userProgress?.completedDays?.includes(reading.day) || false;
                  const isPlanStarted = !!userProgress;
                  const isLocked = isPlanStarted && reading.day > maxDayUnlocked;
                  
                  return (
                    <AccordionItem
                      value={`day-${reading.day}`}
                      key={reading.day}
                      disabled={!isPlanStarted || isLocked}
                      className={`border rounded-md shadow-sm transition-colors mb-4 ${isCompleted ? 'bg-green-500/10 border-green-500/30' : (isPlanStarted ? 'bg-card' : 'bg-muted/30 opacity-70')} ${isLocked ? 'opacity-60' : ''}`}
                    >
                      <div className={`flex items-center p-3 ${!isPlanStarted || isLocked ? 'cursor-not-allowed' : ''}`}>
                        {user && isPlanStarted && (
                          <Checkbox
                            id={`reading-checkbox-${reading.day}`}
                            checked={isCompleted}
                            onCheckedChange={(checked) => handleReadingCompleteToggle(reading.day, checked as boolean)}
                            aria-label={`Mark ${reading.title} as read`}
                            className="mr-3"
                            disabled={isLocked}
                          />
                        )}
                        {(!user || !isPlanStarted) && (
                          <Checkbox disabled className="mr-3" />
                        )}
                        <AccordionTrigger
                          disabled={!isPlanStarted || isLocked}
                          className={`flex-1 text-left font-medium hover:underline [&[data-state=open]>svg]:rotate-180 p-0 ${isCompleted && isPlanStarted ? 'line-through text-muted-foreground' : (isPlanStarted ? 'text-foreground' : 'text-muted-foreground/80')}`}
                        >
                          <span className="flex items-center text-lg">
                            {isLocked && <Lock className="h-4 w-4 mr-2 text-muted-foreground" />}
                            Day {reading.day}: {reading.title}
                          </span>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="p-4 pt-0 border-t mt-2">
                        {isPlanStarted ? (
                          isLocked ? (
                              <p className="text-sm text-muted-foreground italic mt-4">This reading unlocks on its scheduled day. Come back then!</p>
                          ) : (
                              <div className="space-y-4 mt-4">
                                  <p className="text-sm text-foreground/80">{reading.prompt}</p>
                                  {loadingReadingTextId === reading.day && <ReadingTextSkeleton />}
                                  {readingTextError[reading.day] && <Alert variant="destructive"><AlertDescription>{readingTextError[reading.day]}</AlertDescription></Alert>}
                                  {fetchedReadingTexts[reading.day] && !loadingReadingTextId && (
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 whitespace-pre-line bg-muted/50 p-3 rounded-md">
                                      <h4 className="font-semibold text-primary mb-2">{reading.verseReference}</h4>
                                      {fetchedReadingTexts[reading.day]}
                                  </div>
                                  )}
                                  {!fetchedReadingTexts[reading.day] && !loadingReadingTextId && !readingTextError[reading.day] && (
                                  <Button onClick={() => handleFetchReadingText(reading)} variant="outline" size="sm" disabled={isLocked}>
                                      <BookOpen className="mr-2 h-4 w-4" /> {isLocked ? 'Reading Locked' : 'Load Reading'}
                                  </Button>
                                  )}
                                  <div className="text-sm">
                                  <p className="font-semibold text-accent">Prayer Focus:</p>
                                  <p className="text-foreground/80">{reading.prayerFocus}</p>
                                  </div>
                              </div>
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground italic mt-4">Start the plan to read the content.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          )}
        </div>
        
        {user && userProgress?.startedAt && (
          <p className="mt-6 text-sm text-muted-foreground">
            You started this plan on: {userProgress.startedAt instanceof Timestamp ? userProgress.startedAt.toDate().toLocaleDateString() : new Date((userProgress.startedAt as any).seconds * 1000).toLocaleDateString()}.
          </p>
        )}
        {!user && (
          <Alert variant="default" className="mt-6 max-w-lg mx-auto">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link> or <Link href="/signup" className="font-semibold text-primary hover:underline">sign up</Link> to start this plan and track your progress.
            </AlertDescription>
          </Alert>
        )}
      </main>
      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Daily Grace. Journey through Scripture.
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
};

export default IndividualReadingPlanPage;
