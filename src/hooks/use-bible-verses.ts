// src/hooks/use-bible-verses.ts
import { useState, useEffect } from 'react';
import { BibleVerse } from '@/types';
import { getVerseById } from '@/lib/bible-verses'; // Assuming you have a function to get a verse by ID

export const useBibleVerses = (verseIds: string[]) => {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerses = async () => {
      setLoading(true);
      const fetchedVerses = await Promise.all(
        verseIds.map(async (id) => {
          try {
            const verse = await getVerseById(id);
            return verse;
          } catch (error) {
            console.error(`Error fetching verse ${id}:`, error);
            return null;
          }
        })
      );
      setVerses(fetchedVerses.filter((v) => v !== null) as BibleVerse[]);
      setLoading(false);
    };

    if (verseIds && verseIds.length > 0) {
      fetchVerses();
    } else {
      setVerses([]);
      setLoading(false);
    }
  }, [verseIds]);

  return { verses, loading };
};
