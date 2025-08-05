
// src/app/generate-devotional/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BibleVerse, DevotionalContent as FullDevotionalContentType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Terminal, Loader2, ArrowLeft, Bookmark, Send, Search, Sparkles, Edit3 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useJournal } from '@/hooks/use-journal';
import { useToast } from '@/hooks/use-toast';
import { useContent } from '@/contexts/content-context';
// import { generateDevotionalMessage } from '@/ai/flows/generate-devotional-message';
// import type { GenerateDevotionalMessageOutput } from '@/ai/flows/generate-devotional-message';
// import { generatePrayerPoint } from '@/ai/flows/generate-prayer-point';
// import type { GeneratePrayerPointOutput } from '@/ai/flows/generate-prayer-point';
import { DevotionalCard } from '@/components/devotional-card';
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import UserDropdownMenu from '@/components/user-dropdown-menu';

const GenerateDevotionalPageSkeleton = () => (
  <div className="w-full max-w-2xl mx-auto space-y-6">
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <Skeleton className="h-7 w-3/4 rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-5 w-1/3 rounded mb-1" />
        <Skeleton className="h-10 w-full rounded" />
        <Skeleton className="h-10 w-1/3 rounded mt-2" />
      </CardContent>
    </Card>
     <Card className="shadow-xl rounded-xl overflow-hidden opacity-50">
      <CardHeader className="bg-primary/5 p-6">
        <Skeleton className="h-7 w-1/3 mb-2 rounded" />
        <Skeleton className="h-16 w-full rounded" />
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <Skeleton className="h-6 w-1/4 mb-2 rounded" />
          <Skeleton className="h-20 w-full rounded" />
        </div>
        <div className="border-t border-border/50 pt-6">
          <Skeleton className="h-6 w-1/4 mb-2 rounded" />
          <Skeleton className="h-12 w-full rounded" />
        </div>
      </CardContent>
    </Card>
  </div>
);


export default function GenerateDevotionalPage() {
  const { getVerseByReferenceOrId, isLoadingContent: isLoadingAppContextContent, contentError: appContextContentError } = useContent();
  const { user, loading: authLoading } = useAuth();
  const { preferences, isLoaded: preferencesLoaded } = useUserPreferences();
  const { loadJournalEntry, saveJournalEntry, isLoadingJournal, isSavingJournal, journalError } = useJournal();
  const { toast } = useToast();
  const router = useRouter();

  const [verseInput, setVerseInput] = useState('');
  const [selectedVerseForGeneration, setSelectedVerseForGeneration] = useState<BibleVerse | null>(null);
  const [generatedDevotionalContent, setGeneratedDevotionalContent] = useState<FullDevotionalContentType | null>(null);
  
  const [isLoadingVerseLookup, setIsLoadingVerseLookup] = useState(false);
  const [isLoadingAiContent, setIsLoadingAiContent] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [journalText, setJournalText] = useState('');
  const [hasLoadedJournal, setHasLoadedJournal] = useState(false);

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'generate_devotional_page' });
    }
  }, []);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Load journal if a custom devotional has been generated and AI content is done loading
    if (user && generatedDevotionalContent && selectedVerseForGeneration && !isLoadingAiContent && !hasLoadedJournal) {
      const fetchJournal = async () => {
        const entry = await loadJournalEntry(selectedVerseForGeneration.id);
        setJournalText(entry?.text || '');
        setHasLoadedJournal(true);
      };
      fetchJournal();
    }
  }, [user, generatedDevotionalContent, selectedVerseForGeneration, isLoadingAiContent, loadJournalEntry, hasLoadedJournal]);

  const navigateTo = (path: string, pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: 'generate_devotional_page_interaction' });
    }
    router.push(path);
  };

  const handleGenerateDevotional = async () => {
    const currentVerseInput = verseInput.trim();
    if (!currentVerseInput) {
      setLookupError("Please enter a Bible verse reference or ID.");
      return;
    }
    if (isLoadingAppContextContent || !preferencesLoaded) {
        toast({title: "App is loading", description: "Please wait a moment for core content to load.", variant: "default"});
        return;
    }

    setIsLoadingVerseLookup(true);
    setLookupError(null);
    setAiError(null);
    setGeneratedDevotionalContent(null);
    setSelectedVerseForGeneration(null);
    setJournalText('');
    setHasLoadedJournal(false);
    
    if (analytics) {
        logEvent(analytics, 'generate_custom_devotional_attempt', { verse_query: currentVerseInput });
    }

    const verse = await getVerseByReferenceOrId(currentVerseInput);

    if (!verse) {
      setLookupError(`Verse "${currentVerseInput}" not found. Please check the reference or try an ID (e.g., john316).`);
      setIsLoadingVerseLookup(false);
       if (analytics) {
        logEvent(analytics, 'generate_custom_devotional_verse_not_found', { verse_query: currentVerseInput });
      }
      return;
    }

    setSelectedVerseForGeneration(verse);
    setIsLoadingVerseLookup(false);
    setIsLoadingAiContent(true);

    try {
      if (analytics) {
        logEvent(analytics, 'generate_devotional_content_start', { verse_id: verse.id, source: 'custom_generate_page' });
      }
      
      const preferShortFormat = preferences.subscriptionStatus === 'free' ? true : preferences.contentStyle === 'short';

      // const msgOutput: GenerateDevotionalMessageOutput = await generateDevotionalMessage({
      //   bibleVerse: verse.text,
      //   preferShortMessage: preferShortFormat,
      // });
      // const prayerOutput: GeneratePrayerPointOutput = await generatePrayerPoint({
      //   verse: verse.text,
      //   message: msgOutput.message,
      //   preferShortPrayer: preferShortFormat,
      // });
      setGeneratedDevotionalContent({
        verse: verse,
        message: "This is a placeholder message. AI generation is currently disabled.",
        prayerPoint: "This is a placeholder prayer point. AI generation is currently disabled.",
        themes: [],
      });
      if (analytics) {
        logEvent(analytics, 'generate_devotional_content_success', { verse_id: verse.id, source: 'custom_generate_page' });
      }
    } catch (e: any) {
      console.error("Failed to generate custom AI devotional content:", e);
      setAiError(e.message || "Failed to generate inspiration for this verse.");
      if (analytics) {
        logEvent(analytics, 'generate_devotional_content_failed', { verse_id: verse.id, source: 'custom_generate_page', error_message: e.message });
      }
    } finally {
      setIsLoadingAiContent(false);
    }
  };
  
  const handleSaveJournal = async () => {
    if (!user || !selectedVerseForGeneration) {
      toast({ title: "Error", description: "Cannot save journal entry. User or verse missing.", variant: "destructive" });
      return;
    }
    const success = await saveJournalEntry(selectedVerseForGeneration.id, journalText, 'devotional', undefined, undefined, selectedVerseForGeneration.reference);
    if (success) {
      toast({ title: "Journal Saved!", description: `Your reflection for ${selectedVerseForGeneration.reference} has been saved.` });
    } else {
      toast({ title: "Save Failed", description: journalError || "Could not save your journal entry.", variant: "destructive" });
    }
  };


  if (authLoading || isLoadingAppContextContent || !preferencesLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading generator...</p>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><p>Redirecting to login...</p></div>;
  }
  
  const displayError = appContextContentError || lookupError || aiError;

  return (
    <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigateTo('/', 'home_dashboard_page')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Custom Devotional</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserDropdownMenu />
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-8">
        <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-xl bg-card/80 backdrop-blur-sm border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2">
              <Search className="h-5 w-5" /> Enter Verse to Generate Devotional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="verse-input" className="text-sm font-medium text-muted-foreground">
                Bible Verse (e.g., John 3:16 or psalm23_1)
              </Label>
              <Input
                id="verse-input"
                type="text"
                placeholder="Enter verse reference or ID..."
                value={verseInput}
                onChange={(e) => setVerseInput(e.target.value)}
                className="mt-1 bg-background/70 focus:bg-background"
                disabled={isLoadingVerseLookup || isLoadingAiContent}
              />
            </div>
            <Button 
              onClick={handleGenerateDevotional} 
              disabled={isLoadingVerseLookup || isLoadingAiContent || !verseInput.trim()}
              variant="primaryGradient"
            >
              {(isLoadingVerseLookup || isLoadingAiContent) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {(isLoadingVerseLookup) ? 'Looking up verse...' : (isLoadingAiContent) ? 'Generating...' : 'Generate Devotional'}
            </Button>
          </CardContent>
        </Card>
        
        {isLoadingAppContextContent && <GenerateDevotionalPageSkeleton />}
        
        {displayError && (
          <Alert variant="destructive" className="max-w-2xl mx-auto mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{displayError}</AlertDescription>
            {appContextContentError && <p className="text-xs mt-1">This might be due to issues fetching core app data. Ensure 'bible_verses' collection is populated in Firestore.</p>}
          </Alert>
        )}

        {isLoadingAiContent && selectedVerseForGeneration && !aiError && (
          <div className="w-full max-w-2xl mx-auto space-y-6 mt-6">
            <Skeleton className="h-8 w-1/2 rounded mb-2" />
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
            </Card>
          </div>
        )}

        {!isLoadingAiContent && generatedDevotionalContent && !displayError && (
          <>
            <DevotionalCard devotional={generatedDevotionalContent} isCustom={true} />
            <Card className="mt-8 w-full max-w-2xl mx-auto shadow-lg rounded-xl bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  <Edit3 className="h-5 w-5" /> Your Journal for {generatedDevotionalContent.verse.reference}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingJournal && !hasLoadedJournal ? (
                  <>
                    <Skeleton className="h-24 w-full rounded-md mb-3" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                  </>
                ) : (
                  <>
                    <Label htmlFor="custom-journal" className="sr-only">Journal for {generatedDevotionalContent.verse.reference}</Label>
                    <Textarea
                      id="custom-journal"
                      placeholder="Write your reflections, prayers, or thoughts here..."
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      rows={5}
                      className="bg-background/70 focus:bg-background text-sm"
                    />
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
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace. Generate your personal inspiration.</p>
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
