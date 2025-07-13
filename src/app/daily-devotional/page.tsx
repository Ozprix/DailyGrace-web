
// src/app/daily-devotional/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BibleVerse, DevotionalContent as FullDevotionalContentType } from '@/types';
import type { Mood } from '@/hooks/use-journal';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Terminal, Shuffle, Loader2, ArrowLeft, Bookmark, Send, MessageSquareHeart } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useJournal } from '@/hooks/use-journal';
import { useToast } from '@/hooks/use-toast';
import { useContent } from '@/contexts/content-context';
import { DevotionalCard } from '@/components/devotional-card';
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import UserDropdownMenu from '@/components/user-dropdown-menu';
import { MoodSelector } from '@/components/journal/mood-selector';
import { TagInput } from '@/components/journal/tag-input';
import { useReflections } from '@/hooks/use-reflections';
import { ReflectionCard } from '@/components/reflection-card';

const DevotionalPageSkeleton = () => (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary/10 p-6">
          <Skeleton className="h-7 w-1/3 mb-2 rounded" />
          <Skeleton className="h-16 w-full rounded" />
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <Skeleton className="h-6 w-1/4 mb-2 rounded" />
            <Skeleton className="h-20 w-full rounded" />
            <Skeleton className="h-5 w-1/3 mt-4 mb-1.5 rounded" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="border-t border-border/60 pt-6">
            <Skeleton className="h-6 w-1/4 mb-2 rounded" />
            <Skeleton className="h-12 w-full rounded" />
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-muted/30 flex justify-end space-x-3 border-t border-border/50">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </CardFooter>
      </Card>
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <Skeleton className="h-7 w-1/2 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full rounded-md mb-3" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
  
function DailyDevotionalPageComponent() {
    const { allBibleVerses, allChallenges, getVerseById, isLoadingContent: isLoadingAppContextContent, contentError: appContextContentError } = useContent();
    const { user, loading: authLoading } = useAuth();
    const { preferences, isLoaded: preferencesLoaded, recordEngagingActionForStreak } = useUserPreferences();
    const { loadJournalEntry, saveJournalEntry, isLoadingJournal, isSavingJournal, journalError } = useJournal();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
  
    const [currentVerse, setCurrentVerse] = useState<BibleVerse | null>(null);
    const [devotionalContent, setDevotionalContent] = useState<FullDevotionalContentType | null>(null);
    const [isLoadingVerse, setIsLoadingVerse] = useState(true);
    const [isLoadingAiContent, setIsLoadingAiContent] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
  
    const [journalText, setJournalText] = useState('');
    const [selectedMood, setSelectedMood] = useState<Mood | undefined>(undefined);
    const [tags, setTags] = useState<string[]>([]);
    const [hasLoadedJournal, setHasLoadedJournal] = useState(false);
    const [hasProcessedStreak, setHasProcessedStreak] = useState(false);

    // State for community reflections
    const { reflections, isLoading: isLoadingReflections, isSubmitting: isSubmittingReflection, error: reflectionsError, submitReflection, toggleUpvote, currentUserId } = useReflections(currentVerse?.id || '');
    const [newReflectionText, setNewReflectionText] = useState('');
  
    useEffect(() => {
      if (analytics) {
        logEvent(analytics, 'view_page', { page_name: 'daily_devotional_page' });
      }
    }, []);
    
    const getDayOfYear = useCallback(() => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor(diff / oneDay);
    }, []);
  
    const selectDailyVerse = useCallback(() => {
        if (allBibleVerses.length === 0) {
            setAiError("No Bible verses available to select for daily devotional.");
            setCurrentVerse(null);
            setIsLoadingVerse(false);
            return;
        }
        setIsLoadingVerse(true);
        // Check for verse in query params first
        const verseIdFromQuery = searchParams.get('verse');
        if (verseIdFromQuery) {
            const verseFromQuery = getVerseById(verseIdFromQuery);
            if (verseFromQuery) {
                setCurrentVerse(verseFromQuery);
                setIsLoadingVerse(false);
                return;
            }
        }
        
        const dayOfYear = getDayOfYear();
        const verseIndex = dayOfYear % allBibleVerses.length;
        const dailyVerse = allBibleVerses[verseIndex];
        setCurrentVerse(dailyVerse || allBibleVerses[0]); // Fallback to first verse
        setIsLoadingVerse(false);
        if (analytics && dailyVerse) {
            logEvent(analytics, 'daily_verse_selected_for_devotional_page', { verse_id: dailyVerse.id, verse_reference: dailyVerse.reference });
        }
    }, [allBibleVerses, getDayOfYear, searchParams, getVerseById]);
  
    useEffect(() => {
      if (!isLoadingAppContextContent && allBibleVerses.length > 0 && !currentVerse) {
        selectDailyVerse();
      } else if (!isLoadingAppContextContent && allBibleVerses.length === 0 && !appContextContentError) {
        setAiError("No Bible verses available. Please add verses to Firestore.");
        setIsLoadingVerse(false);
      }
    }, [isLoadingAppContextContent, allBibleVerses, selectDailyVerse, currentVerse, appContextContentError]);
  
    useEffect(() => {
      if (currentVerse && preferencesLoaded && !isLoadingAppContextContent) {
        setDevotionalContent(null);
        setIsLoadingAiContent(true);
        setAiError(null);
        setHasLoadedJournal(false);
        setHasProcessedStreak(false);
  
        const generateStaticContent = () => {
          let message = `Reflect on the meaning of "${currentVerse.reference}" and how you can apply its wisdom to your life today.`;
          let prayerPoint = "Lord, help me to understand your word and live it out. Guide my steps and fill my heart with your peace. Amen.";
          let themes: string[] = currentVerse.tags || [];
  
          // Search for a matching prompt in challenges
          let found = false;
          for (const challenge of allChallenges) {
            if (found) break;
            for (const day of challenge.days) {
              if (day.verseReference === currentVerse.id) {
                message = day.prompt;
                prayerPoint = day.prayerFocus;
                if (!themes.includes(challenge.name)) {
                  themes = [...themes, challenge.name];
                }
                found = true;
                break;
              }
            }
          }
  
          if (analytics) {
            logEvent(analytics, 'generate_devotional_content_static', {
              verse_id: currentVerse.id,
              source: 'daily_devotional_page',
              found_in_challenges: found,
            });
          }
  
          setDevotionalContent({
            verse: currentVerse,
            message,
            prayerPoint,
            themes,
          });
  
          setIsLoadingAiContent(false);
        };
  
        const timeoutId = setTimeout(generateStaticContent, 250);
  
        return () => clearTimeout(timeoutId);
      }
    }, [currentVerse, preferencesLoaded, allChallenges, isLoadingAppContextContent]);
  
    useEffect(() => {
      if (user && currentVerse && !isLoadingAiContent && !hasLoadedJournal) {
        const fetchJournal = async () => {
          const entry = await loadJournalEntry(currentVerse.id);
          setJournalText(entry?.text || '');
          setSelectedMood(entry?.mood || undefined);
          setTags(entry?.tags || []);
          setHasLoadedJournal(true);
        };
        fetchJournal();
      }
    }, [user, currentVerse, isLoadingAiContent, loadJournalEntry, hasLoadedJournal]);
  
    useEffect(() => {
      const processStreak = async () => {
        if (user && preferencesLoaded && !isLoadingAppContextContent && !isLoadingAiContent && !hasProcessedStreak && currentVerse) {
          setHasProcessedStreak(true);
          const streakResult = await recordEngagingActionForStreak('viewed_daily_devotional');
          if (streakResult) {
            if (streakResult.status === 'started') {
              toast({ title: "Streak Started!", description: "Keep it up by visiting daily!", variant: "default" });
            } else if (streakResult.status === 'continued') {
              toast({ title: "Streak Continued!", description: `You're on a ${streakResult.newStreak} day streak!`, variant: "default" });
            } else if (streakResult.status === 'reset') {
              toast({ title: "Welcome Back!", description: "Starting a new streak of 1 day!", variant: "default" });
            }
          }
        }
      };
      processStreak();
    }, [user, preferencesLoaded, isLoadingAppContextContent, isLoadingAiContent, currentVerse, recordEngagingActionForStreak, toast, hasProcessedStreak]);
  
    const navigateTo = (path: string, pageName: string) => {
      if (analytics) {
        logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: 'daily_devotional_page_interaction' });
      }
      router.push(path);
    };
  
    const shuffleDevotional = useCallback(() => {
      if (allBibleVerses.length === 0) {
        toast({ title: "Cannot Shuffle", description: "Verses are still loading or unavailable.", variant: "default" });
        return;
      }
      setDevotionalContent(null);
      setIsLoadingVerse(true);
      setIsLoadingAiContent(true); 
      setAiError(null);
      setHasProcessedStreak(false); 
      const randomVerse = allBibleVerses[Math.floor(Math.random() * allBibleVerses.length)];
      setCurrentVerse(randomVerse);
      if (analytics) {
        logEvent(analytics, 'shuffle_devotional_on_page', { new_verse_id: randomVerse.id, previous_verse_id: currentVerse?.id });
      }
      setIsLoadingVerse(false);
    }, [allBibleVerses, toast, currentVerse?.id]);
  
    const handleSaveJournal = async () => {
      if (!user || !currentVerse) {
        toast({ title: "Error", description: "Cannot save journal entry. User or verse missing.", variant: "destructive" });
        return;
      }
      const success = await saveJournalEntry(currentVerse.id, journalText, 'devotional', selectedMood, tags, currentVerse.reference);
      if (success) {
        toast({ title: "Journal Saved!", description: `Your reflection for ${currentVerse.reference} has been saved.` });
      } else {
        toast({ title: "Save Failed", description: journalError || "Could not save your journal entry.", variant: "destructive" });
      }
    };

    const handlePostReflection = async () => {
      const success = await submitReflection(newReflectionText);
      if (success) {
        setNewReflectionText('');
      }
    };
  
    if (authLoading || isLoadingAppContextContent || !preferencesLoaded || isLoadingVerse) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-foreground p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading today's devotional...</p>
        </div>
      );
    }
  
    if (!user) {
      router.push('/login');
      return <div className="min-h-screen flex items-center justify-center"><p>Redirecting to login...</p></div>;
    }
    
    const generalError = appContextContentError || aiError;
  
    return (
      <>
        <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
            <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigateTo('/', 'home_dashboard_page')} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Daily Devotional</h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={shuffleDevotional} title="Get Another Devotional" className="h-9 w-9" disabled={isLoadingAiContent || allBibleVerses.length === 0}>
                <Shuffle className="h-4 w-4" />
                </Button>
                <ThemeToggle />
                <UserDropdownMenu />
            </div>
            </header>
    
            <main className="flex-grow w-full container mx-auto px-4 py-8">
            {isLoadingAiContent && !devotionalContent && !generalError && <DevotionalPageSkeleton />}
            
            {generalError && !isLoadingAiContent && (
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error Loading Devotional</AlertTitle>
                <AlertDescription>{generalError}</AlertDescription>
                {appContextContentError && <p className="text-xs mt-1">This might be due to issues fetching core app data. Ensure 'bible_verses' collection is populated in Firestore.</p>}
                <Button onClick={shuffleDevotional} variant="outline" className="mt-4">Try a Different Verse</Button>
                </Alert>
            )}
    
            {!isLoadingAiContent && devotionalContent && !generalError && (
                <div className="space-y-8">
                  <DevotionalCard 
                      devotional={devotionalContent} 
                      isCustom={false} 
                  />

                  <Card id="daily-journal-card" className="w-full max-w-2xl mx-auto shadow-lg rounded-xl bg-card/80 backdrop-blur-sm border-border/50">
                      <CardHeader>
                      <CardTitle className="text-xl text-primary flex items-center gap-2">
                          <Bookmark className="h-5 w-5" /> Your Journal for {devotionalContent.verse.reference}
                      </CardTitle>
                      </CardHeader>
                      <CardContent>
                      {isLoadingJournal && !hasLoadedJournal ? (
                          <>
                          <Skeleton className="h-24 w-full rounded-md mb-3" />
                          <Skeleton className="h-10 w-32 rounded-md" />
                          </>
                      ) : (
                          <div className="space-y-4">
                          <Label htmlFor="daily-journal" className="sr-only">Journal for {devotionalContent.verse.reference}</Label>
                          <Textarea
                              id="daily-journal"
                              placeholder="Write your reflections, prayers, or thoughts here..."
                              value={journalText}
                              onChange={(e) => setJournalText(e.target.value)}
                              rows={5}
                              className="bg-background/70 focus:bg-background text-sm"
                          />
                          <div className="space-y-2">
                                  <MoodSelector selectedMood={selectedMood} onSelectMood={setSelectedMood} />
                              </div>
                              <div className="space-y-2">
                                  <TagInput tags={tags} setTags={setTags} placeholder="e.g., 'faith', 'family', 'prayer'"/>
                              </div>
                          {journalError && <p className="text-xs text-destructive mt-1">{journalError}</p>}
                          <Button
                              onClick={handleSaveJournal}
                              disabled={isSavingJournal || !journalText.trim()}
                              className="mt-3"
                              variant="secondary"
                          >
                              {isSavingJournal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                              {isSavingJournal ? 'Saving...' : 'Save Journal Entry'}
                          </Button>
                          </div>
                      )}
                      </CardContent>
                  </Card>

                  <Card id="community-reflections-card" className="w-full max-w-2xl mx-auto shadow-lg rounded-xl bg-card/80 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-xl text-primary flex items-center gap-2">
                        <MessageSquareHeart className="h-5 w-5" /> Community Reflections
                      </CardTitle>
                      <CardDescription>Share your thoughts on this verse with the community.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="new-reflection" className="font-semibold">Post a Reflection</Label>
                        <Textarea
                          id="new-reflection"
                          placeholder="What does this verse mean to you?"
                          value={newReflectionText}
                          onChange={(e) => setNewReflectionText(e.target.value)}
                          rows={3}
                          className="mt-2 bg-background/70 focus:bg-background"
                          disabled={isSubmittingReflection || !user}
                        />
                        <Button
                          onClick={handlePostReflection}
                          disabled={isSubmittingReflection || !newReflectionText.trim() || !user}
                          className="mt-3"
                        >
                          {isSubmittingReflection ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                          Post
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {isLoadingReflections && (
                          <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin"/></div>
                        )}
                        {!isLoadingReflections && reflectionsError && (
                          <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{reflectionsError}</AlertDescription>
                          </Alert>
                        )}
                        {!isLoadingReflections && reflections.length === 0 && !reflectionsError && (
                          <p className="text-sm text-center text-muted-foreground py-4">Be the first to share a reflection on this verse!</p>
                        )}
                        {!isLoadingReflections && reflections.length > 0 && (
                          reflections.map(reflection => (
                            <ReflectionCard key={reflection.id} reflection={reflection} currentUserId={currentUserId} onUpvote={toggleUpvote} />
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
            )}
            </main>
    
            <footer className="w-full text-center py-6 px-4 border-t border-border/60">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace. Find your daily inspiration.</p>
            </footer>
        </div>
      </>
    );
}

export default function DailyDevotionalPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center text-foreground p-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading today's devotional...</p>
            </div>
        }>
            <DailyDevotionalPageComponent />
        </Suspense>
    );
}
