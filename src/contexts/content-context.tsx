
// src/contexts/content-context.tsx
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db, analytics } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import type { BibleVerse, Challenge, ExclusiveDevotionalSeries, ThemeStoreItem, StoreItem, SymbolicGiftStoreItem, Quiz, QuizCategoryPublic, Mission, ReadingPlan } from '@/types';
import { logEvent } from 'firebase/analytics';
import { fetchVerseFromExternalAPI } from '@/services/bible-api.service';

interface ContentContextType {
  allBibleVerses: BibleVerse[];
  allChallenges: Challenge[];
  allStoreItems: StoreItem[];
  allQuizzes: Quiz[];
  allQuizCategories: QuizCategoryPublic[];
  allMissions: Mission[];
  allReadingPlans: ReadingPlan[];
  isLoadingContent: boolean;
  contentError: string | null;
  getVerseById: (id?: string) => BibleVerse | undefined;
  getVerseByReferenceOrId: (referenceOrId: string) => Promise<BibleVerse | undefined>;
  getChallengeById: (id?: string) => Challenge | undefined;
  getExclusiveSeriesById: (id?: string) => ExclusiveDevotionalSeries | undefined;
  getThemeItemById: (id?: string) => ThemeStoreItem | undefined;
  getSymbolicGiftById: (id?: string) => SymbolicGiftStoreItem | undefined;
  getAllExclusiveSeries: () => ExclusiveDevotionalSeries[];
  getAllThemeItems: () => ThemeStoreItem[];
  getAllSymbolicGifts: () => SymbolicGiftStoreItem[];
  getQuizById: (id?: string) => Quiz | undefined;
  getQuizzesByCategoryId: (categoryId?: string) => Quiz[];
  getQuizCategoryById: (id?: string) => QuizCategoryPublic | undefined;
  getMissionById: (id?: string) => Mission | undefined;
  getReadingPlanById: (id?: string) => ReadingPlan | undefined;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [allBibleVerses, setAllBibleVerses] = useState<BibleVerse[]>([]);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [allStoreItems, setAllStoreItems] = useState<StoreItem[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [allQuizCategories, setAllQuizCategories] = useState<QuizCategoryPublic[]>([]);
  const [allMissions, setAllMissions] = useState<Mission[]>([]);
  const [allReadingPlans, setAllReadingPlans] = useState<ReadingPlan[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFirestoreContent = async () => {
      setIsLoadingContent(true);
      setContentError(null);
      try {
        // Create all promises
        const versesPromise = getDocs(query(collection(db, 'bible_verses'), orderBy('id')));
        const challengesPromise = getDocs(query(collection(db, 'challenges_meta'), orderBy('name')));
        const storeItemsPromise = getDocs(query(collection(db, 'exclusive_content_meta'), orderBy('name')));
        const quizzesPromise = getDocs(query(collection(db, 'quizzes'), orderBy('title')));
        const quizCategoriesPromise = getDocs(query(collection(db, 'quiz_categories'), orderBy('name')));
        const missionsPromise = getDocs(query(collection(db, 'missions')));
        const readingPlansPromise = getDocs(query(collection(db, 'readingPlans'), orderBy('name')));

        // Await all promises
        const [
          versesSnapshot,
          challengesSnapshot,
          storeItemsSnapshot,
          quizzesSnapshot,
          quizCategoriesSnapshot,
          missionsSnapshot,
          readingPlansSnapshot,
        ] = await Promise.all([
          versesPromise,
          challengesPromise,
          storeItemsPromise,
          quizzesPromise,
          quizCategoriesPromise,
          missionsPromise,
          readingPlansPromise,
        ]);
        
        // Process results
        const verses = versesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BibleVerse));
        setAllBibleVerses(verses);

        const challengesData = challengesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
        setAllChallenges(challengesData);

        const storeItemsData = storeItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreItem));
        setAllStoreItems(storeItemsData);

        const quizzesData = quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
        setAllQuizzes(quizzesData);

        const quizCategoriesData = quizCategoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizCategoryPublic));
        setAllQuizCategories(quizCategoriesData);

        const missionsData = missionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
        setAllMissions(missionsData);

        const readingPlansData = readingPlansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingPlan));
        setAllReadingPlans(readingPlansData);

        if (analytics) {
          logEvent(analytics, 'fetch_app_content_success', { 
              verses: verses.length,
              challenges: challengesData.length,
              store_items: storeItemsData.length,
              quizzes: quizzesData.length,
              quiz_categories: quizCategoriesData.length,
              missions: missionsData.length,
              reading_plans: readingPlansData.length,
          });
        }

      } catch (error: any) {
        console.error("Failed to fetch content from Firestore:", error);
        setContentError(error.message || "Failed to load app content.");
        if (analytics) {
          logEvent(analytics, 'fetch_app_content_failed', { error_message: error.message });
        }
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchFirestoreContent();
  }, []);

  const getVerseById = useCallback((id?: string): BibleVerse | undefined => {
    if (!id) return undefined;
    return allBibleVerses.find(v => v.id.toLowerCase() === id.toLowerCase());
  }, [allBibleVerses]);

  const getVerseByReferenceOrId = useCallback(async (referenceOrId: string): Promise<BibleVerse | undefined> => {
    if (!referenceOrId || referenceOrId.trim() === '') return undefined;
  
    const references = referenceOrId.split(',').map(ref => ref.trim());
    const verses: BibleVerse[] = [];
  
    for (const reference of references) {
      const apiVerse = await fetchVerseFromExternalAPI(reference);
      if (apiVerse) {
        verses.push(apiVerse);
        continue;
      }
  
      if (analytics) logEvent(analytics, 'external_api_fallback_to_firestore', { query: reference });
      console.warn(`Verse "${reference}" not found via external API. Falling back to Firestore cache.`);
      
      const byId = allBibleVerses.find(v => v.id.toLowerCase() === reference.toLowerCase().replace(/\s+/g, '').replace(/:/g, ''));
      if (byId) {
        verses.push(byId);
        continue;
      }
  
      const byReference = allBibleVerses.find(v => v.reference.toLowerCase() === reference.toLowerCase());
      if (byReference) {
        verses.push(byReference);
        continue;
      }
  
      if (analytics) logEvent(analytics, 'verse_not_found_after_api_and_firestore_fallback', { query: reference });
      console.warn(`[getVerseByReferenceOrId] Verse not found in API or Firestore cache for: ${reference}`);
    }
  
    if (verses.length === 0) {
      return undefined;
    }
  
    if (verses.length === 1) {
      return verses[0];
    }
  
    // For multiple verses, combine them into a single BibleVerse object
    return {
      id: verses.map(v => v.id).join(','),
      reference: verses.map(v => v.reference).join(', '),
      text: verses.map(v => v.text).join(' '),
    };
  }, [allBibleVerses]);

  const getChallengeById = (id?: string): Challenge | undefined => {
    if (!id) return undefined;
    return allChallenges.find(c => c.id === id);
  };

  const getExclusiveSeriesById = (id?: string): ExclusiveDevotionalSeries | undefined => {
    if (!id) return undefined;
    const item = allStoreItems.find(s => s.id === id && s.type === 'devotional_series');
    return item as ExclusiveDevotionalSeries | undefined;
  };
  
  const getThemeItemById = (id?: string): ThemeStoreItem | undefined => {
    if (!id) return undefined;
    const item = allStoreItems.find(s => s.id === id && s.type === 'theme');
    return item as ThemeStoreItem | undefined;
  };

  const getSymbolicGiftById = (id?: string): SymbolicGiftStoreItem | undefined => {
    if (!id) return undefined;
    const item = allStoreItems.find(s => s.id === id && s.type === 'symbolic_gift');
    return item as SymbolicGiftStoreItem | undefined;
  };

  const getAllExclusiveSeries = (): ExclusiveDevotionalSeries[] => {
    return allStoreItems.filter(item => item.type === 'devotional_series') as ExclusiveDevotionalSeries[];
  };

  const getAllThemeItems = (): ThemeStoreItem[] => {
    return allStoreItems.filter(item => item.type === 'theme') as ThemeStoreItem[];
  };

  const getAllSymbolicGifts = (): SymbolicGiftStoreItem[] => {
    return allStoreItems.filter(item => item.type === 'symbolic_gift') as SymbolicGiftStoreItem[];
  };

  const getQuizById = (id?: string): Quiz | undefined => {
    if (!id) return undefined;
    return allQuizzes.find(q => q.id === id);
  };

  const getQuizzesByCategoryId = (categoryId?: string): Quiz[] => {
    if (!categoryId) return [];
    return allQuizzes.filter(q => q.categoryId === categoryId);
  };

  const getQuizCategoryById = (id?: string): QuizCategoryPublic | undefined => {
    if (!id) return undefined;
    return allQuizCategories.find(c => c.id === id);
  };

  const getMissionById = useCallback((id?: string): Mission | undefined => {
    if (!id) return undefined;
    return allMissions.find(m => m.id === id);
  }, [allMissions]);

  const getReadingPlanById = useCallback((id?: string): ReadingPlan | undefined => {
    if (!id) return undefined;
    return allReadingPlans.find(p => p.id === id);
  }, [allReadingPlans]);

  const value = { 
    allBibleVerses, 
    allChallenges, 
    allStoreItems,
    allQuizzes,
    allQuizCategories,
    allMissions,
    allReadingPlans,
    isLoadingContent, 
    contentError, 
    getVerseById, 
    getVerseByReferenceOrId, 
    getChallengeById,
    getExclusiveSeriesById,
    getThemeItemById,
    getSymbolicGiftById,
    getAllExclusiveSeries,
    getAllThemeItems,
    getAllSymbolicGifts,
    getQuizById,
    getQuizzesByCategoryId,
    getQuizCategoryById,
    getMissionById,
    getReadingPlanById,
  };

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}
