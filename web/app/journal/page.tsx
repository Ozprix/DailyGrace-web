"use client";

import { useState, useEffect, useMemo } from "react";
import { useJournal } from "@/hooks/use-journal";
import type { JournalEntry, Mood } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { Leaf, Hand, Brain, Sun, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const moodIcons: { [key in Mood]: React.ElementType } = {
    inspired: Sun,
    grateful: Hand,
    reflective: Brain,
    peaceful: Leaf,
    troubled: CloudRain,
};

const moodColors: { [key in Mood]: string } = {
    inspired: "text-yellow-500",
    grateful: "text-green-500",
    reflective: "text-blue-500",
    peaceful: "text-teal-500",
    troubled: "text-gray-500",
};


export default function JournalPage() {
  const { loadAllJournalEntries, isLoadingJournal, journalError } = useJournal();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEntries = async () => {
      const allEntries = await loadAllJournalEntries();
      setEntries(allEntries);
    };

    fetchEntries();
  }, [loadAllJournalEntries]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
        entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!activeTag) return entries;
    return entries.filter(entry => entry.tags?.includes(activeTag));
  }, [entries, activeTag]);

  if (isLoadingJournal) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading your journal...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
        <div className="flex justify-between items-start mb-6">
            <div>
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-3xl font-bold">My Journal</h1>
            </div>
            {allTags.length > 0 && (
                <div className="w-1/3">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Tag className="h-5 w-5 text-muted-foreground"/>
                        Filter by Tag
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            variant={!activeTag ? "secondary" : "outline"} 
                            size="sm" 
                            onClick={() => setActiveTag(null)}
                        >
                            All
                        </Button>
                        {allTags.map(tag => (
                            <Button 
                                key={tag} 
                                variant={activeTag === tag ? "secondary" : "outline"} 
                                size="sm" 
                                onClick={() => setActiveTag(tag)}
                            >
                                {tag}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      

      {journalError && <p className="text-red-500">{journalError}</p>}

      <div className="space-y-6">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle>{entry.verseReference}</CardTitle>
                <CardDescription>
                  {entry.lastSaved instanceof Date ? entry.lastSaved.toLocaleDateString() : 'Date unavailable'}
                </CardDescription>
                <div className="flex items-center gap-4 pt-2">
                    {entry.mood && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Mood:</span>
                            <div className="flex items-center gap-1">
                            {(() => {
                                const Icon = moodIcons[entry.mood as Mood];
                                const color = moodColors[entry.mood as Mood];
                                return <Icon className={cn("h-5 w-5", color)} />;
                            })()}
                            <span className="text-sm capitalize">{entry.mood}</span>
                            </div>
                        </div>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                             <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                            {entry.tags.map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{entry.text}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>You haven't written any journal entries {activeTag ? `with the tag "${activeTag}"` : 'yet'}.</p>
        )}
      </div>
    </div>
  );
}
