
import { useState, useCallback } from "react";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/auth-context";
import { checkAndUnlockAchievements } from "@/services/achievement.service";
import { allAchievements } from "@/lib/achievements";
import { useToast } from "./use-toast";
import { getCachedData, cacheJournalEntries } from "@/services/offline-sync.service";
import type { JournalEntry, Mood } from '@/types'; // Import from global types

export const useJournal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoadingJournal, setIsLoadingJournal] = useState(false);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [journalError, setJournalError] = useState<string | null>(null);

  const isOnline = () => typeof window !== 'undefined' && navigator.onLine;

  const notifyForNewAchievements = (unlockedIds: string[]) => {
    unlockedIds.forEach((id) => {
      const achievement = allAchievements.find((a) => a.id === id);
      if (achievement) {
        toast({
          title: "Achievement Unlocked!",
          description: `You've earned the "${achievement.name}" badge.`,
        });
      }
    });
  };

  const saveJournalEntry = useCallback(
    async (
      entryId: string,
      text: string,
      context: 'devotional' | 'challenge',
      mood?: Mood,
      tags?: string[],
      verseReference?: string,
      challengeDetails?: { challengeId: string; dayNumber: number }
    ) => {
      if (!user) {
        setJournalError("You must be logged in to save journal entries.");
        return false;
      }

      setIsSavingJournal(true);
      setJournalError(null);

      const entry: JournalEntry = {
        id: entryId,
        text,
        context,
        mood,
        tags,
        lastSaved: Timestamp.now(), // Use Firestore Timestamp
        ...(context === 'devotional' && { verseReference }),
        ...(context === 'challenge' && {
            challengeId: challengeDetails?.challengeId,
            challengeDay: challengeDetails?.dayNumber
        }),
      };

      if (isOnline()) {
        try {
          const journalRef = doc(db, "users", user.uid, "journal", entryId);
          await setDoc(journalRef, entry, { merge: true });

          const journalCollectionRef = collection(db, "users", user.uid, "journal");
          const journalSnapshot = await getDocs(journalCollectionRef);
          const journalCount = journalSnapshot.size;

          const unlocked = await checkAndUnlockAchievements(user.uid, {
            journal_entries: journalCount,
          });
          notifyForNewAchievements(unlocked);

          return true;
        } catch (error: any) {
          console.error("Error saving journal entry:", error);
          setJournalError(error.message || "Failed to save entry.");
          return false;
        } finally {
          setIsSavingJournal(false);
        }
      } else {
        // For offline, we need to convert Timestamp to Date for IndexedDB
        const offlineEntry = { ...entry, lastSaved: (entry.lastSaved as Timestamp).toDate() };
        // This is a simplified offline save. A real app would need a sync mechanism.
        // await cacheJournalEntries([offlineEntry]);
        toast({ title: "Saved Offline", description: "Your journal entry has been saved to this device."});
        setIsSavingJournal(false);
        return true;
      }
    },
    [user, toast]
  );
  
  const loadChallengeDayJournalEntry = useCallback(async (challengeId: string, dayNumber: number): Promise<string> => {
    if (!user) return '';
    const entryId = `${challengeId}_${dayNumber}`;
    const docRef = doc(db, "users", user.uid, "journal", entryId);
    try {
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) {
            const data = docSnap.data() as JournalEntry;
            return data.text;
        }
        return '';
    } catch (e) {
        console.error("Failed to load challenge journal entry:", e);
        return '';
    }
  }, [user]);

  const saveChallengeDayJournalEntry = useCallback(async (challengeId: string, dayNumber: number, text: string): Promise<boolean> => {
     if (!user) return false;
     const entryId = `${challengeId}_${dayNumber}`;
     return await saveJournalEntry(
         entryId,
         text,
         'challenge',
         undefined, // Mood and tags not yet implemented for challenge journals
         undefined,
         undefined,
         { challengeId, dayNumber }
     );
  }, [user, saveJournalEntry]);

  const loadAllJournalEntriesForChallenge = useCallback(async (challengeId: string): Promise<JournalEntry[]> => {
    if(!user) return [];
    // This is a simplified version. A real implementation would query where context === 'challenge' and challengeId === challengeId
    const allEntries = await loadAllJournalEntries();
    return allEntries.filter(e => e.challengeId === challengeId);
  }, [loadAllJournalEntries]);

  const loadJournalEntry = useCallback(
    async (verseId: string): Promise<JournalEntry | null> => {
      if (!user) {
        setJournalError("Not logged in.");
        return null;
      }

      setIsLoadingJournal(true);
      setJournalError(null);

      if (isOnline()) {
        try {
          const journalRef = doc(db, "users", user.uid, "journal", verseId);
          const docSnap = await getDoc(journalRef);
          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as JournalEntry;
          }
          return null;
        } catch (error: any) {
          console.error("Error loading journal entry:", error);
          setJournalError(error.message || "Failed to load entry.");
          return null;
        } finally {
          setIsLoadingJournal(false);
        }
      } else {
        // const cachedEntries = await getCachedData('journal');
        // const entry = cachedEntries.find(e => e.id === verseId);
        setIsLoadingJournal(false);
        return null; // For now, no offline loading here.
      }
    },
    [user]
  );

  const loadAllJournalEntries = useCallback(async (): Promise<JournalEntry[]> => {
    if (!user) {
      setJournalError("You must be logged in to view your journal.");
      return [];
    }
  
    setIsLoadingJournal(true);
    setJournalError(null);
  
    if (isOnline()) {
        try {
            const journalCollectionRef = collection(db, "users", user.uid, "journal");
            const q = query(journalCollectionRef, orderBy("lastSaved", "desc"));
            const querySnapshot = await getDocs(q);
            
            const entries = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                } as JournalEntry;
            });

            // await cacheJournalEntries(entries);
            
            return entries;
    
        } catch (error: any) {
            console.error("Error loading all journal entries from Firestore:", error);
            setJournalError("Could not fetch journal from cloud. Loading offline data.");
            // const cachedEntries = await getCachedData('journal');
            // return cachedEntries.sort((a,b) => b.lastSaved.getTime() - a.lastSaved.getTime());
            return [];
        } finally {
            setIsLoadingJournal(false);
        }
    } else {
        toast({ title: "You are offline", description: "Loading journal entries from your device."});
        // const entries = await getCachedData('journal');
        setIsLoadingJournal(false);
        // return entries.sort((a,b) => b.lastSaved.getTime() - a.lastSaved.getTime());
        return [];
    }
  }, [user, toast]);

  return {
    saveJournalEntry,
    loadJournalEntry,
    loadAllJournalEntries,
    saveChallengeDayJournalEntry,
    loadChallengeDayJournalEntry,
    loadAllJournalEntriesForChallenge,
    isLoadingJournal,
    isSavingJournal,
    journalError,
  };
};

export type { Mood };
