
// src/components/journal-entry-display-card.tsx
"use client";

import type { DisplayJournalEntry } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CalendarDays, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface JournalEntryDisplayCardProps {
  entry: DisplayJournalEntry;
}

export function JournalEntryDisplayCard({ entry }: JournalEntryDisplayCardProps) {
  const isVerseEntry = !!entry.verse;
  const isChallengeEntry = !!entry.challengeId && !!entry.challengeDay;

  let title = "Journal Entry";
  let subtitle: string | undefined = undefined;

  if (isVerseEntry && entry.verse) {
    title = entry.verse.reference;
    subtitle = `"${entry.verse.text}"`;
  } else if (isChallengeEntry) {
    title = entry.challengeName || "Challenge Reflection";
    subtitle = `Day ${entry.challengeDay}: ${entry.challengeDayTitle || 'Reflection'}`;
  }


  return (
    <Card className="w-full shadow-md bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-xl text-primary flex items-center gap-2">
          {isVerseEntry ? <BookOpen className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          {title}
        </CardTitle>
        {subtitle && (
          <CardDescription className="text-sm text-muted-foreground italic pt-1 line-clamp-2">
            {subtitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-foreground/90 whitespace-pre-line leading-relaxed line-clamp-4">{entry.text}</p>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5" />
        Last updated: {entry.lastUpdatedAt ? format(entry.lastUpdatedAt.toDate(), 'MMMM d, yyyy HH:mm') : 'N/A'}
      </CardFooter>
    </Card>
  );
}

