
// src/app/challenges/[challengeId]/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useUserChallenges } from '@/hooks/use-user-challenges';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useJournal } from '@/hooks/use-journal';
import { useBibleVerses } from '@/hooks/use-bible-verses';
import { useContent } from '@/contexts/content-context';
// import { generateChallengeDayContent, type GenerateChallengeDayContentOutput } from '@/ai/flows/generate-challenge-day-content';
import type { ChallengeDay } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const ChallengePage = () => {
  const { challengeId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getChallengeById } = useContent();
  const { 
    getChallengeProgress, 
    isLoading: challengesLoading,
    markDayAsComplete,
    isUpdatingProgress
  } = useUserChallenges();
  const [activeDay, setActiveDay] = useState<ChallengeDay | null>(null);
  const [journalEntry, setJournalEntry] = useState('');
  // const [generatedContent, setGeneratedContent] = useState<GenerateChallengeDayContentOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { preferences, isLoaded: preferencesLoaded } = useUserPreferences();
  const { saveJournalEntry, isLoadingJournal: journalLoading } = useJournal();

  const challenge = useMemo(
    () => getChallengeById(challengeId as string),
    [getChallengeById, challengeId]
  );

  const userChallenge = useMemo(
    () => getChallengeProgress(challengeId as string),
    [getChallengeProgress, challengeId]
  );

  const verseIds = useMemo(
    () => challenge?.days.map((d) => d.verseReference).filter(Boolean) as string[],
    [challenge]
  );

  const { verses, loading: versesLoading } = useBibleVerses(verseIds || []);

  const handleDayToggle = (dayNumber: number) => {
    if (challenge) {
      const day = challenge.days.find((d) => d.day === dayNumber);
      setActiveDay(day || null);
    }
  };

  const handleGenerateContent = useCallback(async () => {
    if (!activeDay || !challenge) return;
    setIsGenerating(true);
    try {
      // Temporarily disabled AI functionality for performance testing
      toast({
        title: 'AI Generation Temporarily Disabled',
        description: 'This feature is being optimized for performance.',
      });
    } catch (error) {
      toast({
        title: 'Error generating content',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [activeDay, challenge, verses, preferences]);

  const handleSaveJournal = async () => {
    if (!activeDay || !journalEntry || !challenge) return;
    await saveJournalEntry(
      `${challenge.id}_${activeDay.day}`,
      journalEntry,
      'challenge',
      undefined,
      undefined,
      undefined,
      { challengeId: challenge.id, dayNumber: activeDay.day }
    );
    setJournalEntry('');
  };

  if (challengesLoading || !preferencesLoaded || versesLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-4 w-1/4 mb-4" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Challenge not found</h1>
        <p>This challenge may not exist or has been removed.</p>
        <Button onClick={() => router.push('/challenges')} className="mt-4">
          Back to Challenges
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{challenge.name}</h1>
      <p className="text-muted-foreground mb-6">{challenge.description}</p>
      {/* The Accordion component was removed from imports, so this section is commented out */}
      {/* <Accordion type="single" collapsible onValueChange={(value) => handleDayToggle(Number(value))}>
        {challenge.days.map((day) => (
          <AccordionItem value={String(day.dayNumber)} key={day.dayNumber}>
            <AccordionTrigger>
              <div className="flex items-center justify-between w-full">
                <span>Day {day.dayNumber}: {day.title}</span>
                {userChallenge?.completedDays.includes(day.dayNumber) && (
                  <span className="text-green-500 text-sm">Completed</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="p-6">
                  <p className="font-semibold mb-2">Theme: {day.theme}</p>
                  <p className="mb-4">{day.prompt}</p>
                  {verses.find((v) => v.id === day.verseId) && (
                    <div className="mb-4">
                      <p className="font-semibold">Verse of the Day:</p>
                      <p className="italic">
                        {verses.find((v) => v.id === day.verseId)?.text} -{' '}
                        {verses.find((v) => v.id === day.verseId)?.reference}
                      </p>
                    </div>
                  )}

                  {preferences?.enableAiFeatures && (
                    <div className="my-4 p-4 border rounded-lg">
                      <h4 className="font-semibold text-lg mb-2">AI-Powered Reflection & Prayer</h4>
                      {isGenerating ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : generatedContent ? (
                        <div>
                          <p><strong>Reflection:</strong> {generatedContent.reflection}</p>
                          <p><strong>Prayer Point:</strong> {generatedContent.prayerPoint}</p>
                        </div>
                      ) : (
                        <p>Generate a personalized reflection and prayer point based on today's theme.</p>
                      )}
                      <Button onClick={handleGenerateContent} disabled={isGenerating} className="mt-2">
                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                      </Button>
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="font-semibold">Journal Entry</h4>
                    <Textarea
                      value={journalEntry}
                      onChange={(e) => setJournalEntry(e.target.value)}
                      placeholder="Your thoughts and reflections..."
                      className="mt-2"
                    />
                    <Button onClick={handleSaveJournal} disabled={journalLoading} className="mt-2">
                      {journalLoading ? 'Saving...' : 'Save Journal Entry'}
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox id={`day-${day.dayNumber}-complete`} />
                    <label
                      htmlFor={`day-${day.dayNumber}-complete`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mark as complete
                    </label>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion> */}
    </div>
  );
};

export default ChallengePage;
