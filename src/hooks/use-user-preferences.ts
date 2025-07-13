// src/hooks/use-user-preferences.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db, analytics } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import type { NotificationFrequency, ContentStyle, UserPreferences, SubscriptionStatus } from '@/types';
import { format, subDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useContent } from '@/contexts/content-context';

const USER_PREFERENCES_KEY_LOCALSTORAGE = 'dailyGraceUserPreferences_local_v2';

const defaultPrefs: UserPreferences = {
  frequency: 'once',
  contentStyle: 'detailed',
  enableChallengeReminders: true,
  enableWeeklyDigest: false,
  subscriptionStatus: 'free',
  totalPoints: 0,
  unlockedExclusiveSeriesIds: [],
  unlockedThemeIds: [],
  activeCustomThemeId: null,
  currentStreak: 0,
  lastStreakDate: null,
  longestStreak: 0,
  verseOfTheDayId: 'john316', // Default starting verse
  onboardingCompleted: false,
  lastChallengeCompletedAt: null,
  dailyContentLastUpdated: null,
};

type SavingPreferenceType =
  | null
  | 'frequency'
  | 'contentStyle'
  | 'challengeReminders'
  | 'subscriptionStatus'
  | 'points'
  | 'unlockedSeries'
  | 'unlockedThemes'
  | 'activeTheme'
  | 'streak'
  | 'symbolicGift'
  | 'lastChallengeCompletion'
  | 'onboardingCompleted'
  | 'dailyContent'
  | 'weeklyDigest';


export function useUserPreferences() {
  const { user } = useAuth();
  const { allBibleVerses, isLoadingContent: isLoadingContentContext } = useContent();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPrefs);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingPreferenceType, setSavingPreferenceType] = useState<SavingPreferenceType>(null);


  const getPreferencesDocRef = useCallback(() => {
    if (!user) return null;
    return doc(db, 'user_preferences', user.uid);
  }, [user]);

  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoaded(false);
      if (user) {
        const docRef = getPreferencesDocRef();
        if (!docRef) {
          setPreferences(defaultPrefs);
          setIsLoaded(true);
          return;
        }
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<UserPreferences>;
            setPreferences({
              ...defaultPrefs,
              ...data,
            });
          } else {
            setPreferences(defaultPrefs);
            await setDoc(docRef, defaultPrefs, { merge: true });
          }
        } catch (error) {
          console.error("Failed to load user preferences from Firestore:", error);
          setPreferences(defaultPrefs);
        }
      } else {
        if (typeof window !== 'undefined') {
          const storedPrefs = localStorage.getItem(USER_PREFERENCES_KEY_LOCALSTORAGE);
          if (storedPrefs) {
            try {
              const parsedPrefs = JSON.parse(storedPrefs) as Partial<UserPreferences>;
              setPreferences({
                ...defaultPrefs,
                ...parsedPrefs,
              });
            } catch (error) {
              console.error("Failed to parse user preferences from localStorage:", error);
              setPreferences(defaultPrefs);
            }
          } else {
            setPreferences(defaultPrefs);
          }
        }
      }
      setIsLoaded(true);
    };

    loadPreferences();
  }, [user, getPreferencesDocRef]);

  const updatePreference = useCallback(async (newPrefsPartial: Partial<UserPreferences>, type: SavingPreferenceType) => {
    if (!type) return;
    setIsSaving(true);
    setSavingPreferenceType(type);
    const oldPreferences = { ...preferences };
    const updatedFullPrefs = { ...preferences, ...newPrefsPartial };
    setPreferences(updatedFullPrefs); 

    if (analytics) {
      logEvent(analytics, 'user_preference_changed', { preference_type: type });
    }

    try {
      if (user) {
        const docRef = getPreferencesDocRef();
        if (!docRef) throw new Error("User document reference not found for saving preferences.");
        await setDoc(docRef, newPrefsPartial, { merge: true });
      } else {
        if (typeof window !== 'undefined') {
          const localPrefsToSave = { ...updatedFullPrefs };
          // Exclude fields not stored locally for anonymous users
          delete (localPrefsToSave as Partial<UserPreferences>).totalPoints;
          // ... and other non-local fields
          localStorage.setItem(USER_PREFERENCES_KEY_LOCALSTORAGE, JSON.stringify(localPrefsToSave));
        }
      }
    } catch (error) {
      console.error(`Failed to update user preference type '${type}':`, error);
      setPreferences(oldPreferences);
      if (analytics) {
          logEvent(analytics, 'user_preference_change_failed', {
          preference_type: type,
          error_message: (error as Error).message,
        });
      }
    } finally {
      setIsSaving(false);
      setSavingPreferenceType(null);
    }
  }, [preferences, user, getPreferencesDocRef]);

  // This effect ensures the verse of the day is updated once per day
  useEffect(() => {
    const checkAndSetDailyVerse = async () => {
      if (!user || !isLoaded || isLoadingContentContext || allBibleVerses.length === 0) {
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      if (preferences.dailyContentLastUpdated !== todayStr) {
        console.log("New day detected or daily content not set. Selecting a new verse of the day.");
        if (analytics) {
            logEvent(analytics, 'daily_verse_selection_triggered', { reason: 'new_day' });
        }
        
        const getDayOfYear = () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), 0, 0);
          const diff = now.getTime() - start.getTime();
          const oneDay = 1000 * 60 * 60 * 24;
          return Math.floor(diff / oneDay);
        };

        const dayOfYear = getDayOfYear();
        const verseIndex = dayOfYear % allBibleVerses.length;
        const newVerse = allBibleVerses[verseIndex];

        if (newVerse && newVerse.id) {
          await updatePreference({
            verseOfTheDayId: newVerse.id,
            dailyContentLastUpdated: todayStr,
          }, 'dailyContent');
        }
      }
    };

    checkAndSetDailyVerse();
  }, [user, isLoaded, isLoadingContentContext, allBibleVerses, preferences.dailyContentLastUpdated, updatePreference]);
  
  const recordEngagingActionForStreak = useCallback(async (actionType: string): Promise<{ status: 'continued' | 'started' | 'no_change' | 'reset', newStreak: number } | null> => {
    if (!user || !isLoaded) return null; 

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");

    let newCurrentStreak = preferences.currentStreak || 0;
    let newLastStreakDate = preferences.lastStreakDate || null;
    let newLongestStreak = preferences.longestStreak || 0;
    let streakStatus: 'continued' | 'started' | 'no_change' | 'reset' = 'no_change';

    if (newLastStreakDate === todayStr) {
      streakStatus = 'no_change';
    } else if (newLastStreakDate === yesterdayStr) {
      newCurrentStreak++;
      newLastStreakDate = todayStr;
      streakStatus = 'continued';
       if (analytics) logEvent(analytics, 'streak_continued', { action_type: actionType, new_streak_length: newCurrentStreak });
    } else {
      newCurrentStreak = 1;
      newLastStreakDate = todayStr;
      streakStatus = preferences.lastStreakDate ? 'reset' : 'started'; 
      if (analytics) logEvent(analytics, preferences.lastStreakDate ? 'streak_broken_and_restarted' : 'streak_started', { action_type: actionType });
    }

    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
      if (analytics) logEvent(analytics, 'new_longest_streak', { longest_streak: newLongestStreak });
    }
    
    const streakUpdates: Partial<UserPreferences> = {
      currentStreak: newCurrentStreak,
      lastStreakDate: newLastStreakDate,
      longestStreak: newLongestStreak,
    };

    await updatePreference(streakUpdates, 'streak');
    
    return { status: streakStatus, newStreak: newCurrentStreak };

  }, [user, preferences, isLoaded, updatePreference]);


  const awardPoints = useCallback(async (pointsToAward: number): Promise<boolean> => {
    if (!user) return false;
    
    setSavingPreferenceType('points');
    setIsSaving(true);
    const docRef = getPreferencesDocRef();
    if (!docRef) { setIsSaving(false); setSavingPreferenceType(null); return false; }

    try {
        await updateDoc(docRef, { totalPoints: increment(pointsToAward) });
        setPreferences(prev => ({ ...prev, totalPoints: (prev.totalPoints || 0) + pointsToAward }));
        if (analytics) {
            logEvent(analytics, 'points_awarded', { points: pointsToAward });
        }
        return true;
    } catch (error) {
        console.error("Failed to award points:", error);
        return false;
    } finally {
        setIsSaving(false); setSavingPreferenceType(null);
    }
  }, [user, getPreferencesDocRef]);

  const unlockExclusiveSeries = useCallback(async (seriesId: string, cost: number): Promise<boolean> => {
    if (!user) return false;
    setSavingPreferenceType('unlockedSeries');
    setIsSaving(true);
    if ((preferences.totalPoints || 0) < cost) {
        setIsSaving(false); setSavingPreferenceType(null);
        return false;
    }
    const docRef = getPreferencesDocRef();
    if (!docRef) { setIsSaving(false); setSavingPreferenceType(null); return false; }

    try {
        await updateDoc(docRef, {
            totalPoints: increment(-cost),
            unlockedExclusiveSeriesIds: arrayUnion(seriesId)
        });
        setPreferences(prev => ({
            ...prev,
            totalPoints: (prev.totalPoints || 0) - cost,
            unlockedExclusiveSeriesIds: [...(prev.unlockedExclusiveSeriesIds || []), seriesId]
        }));
        return true;
    } catch (error) {
        console.error("Failed to unlock exclusive series:", error);
        return false;
    } finally {
        setIsSaving(false); setSavingPreferenceType(null);
    }
  }, [user, preferences.totalPoints, preferences.unlockedExclusiveSeriesIds, getPreferencesDocRef]);

  const unlockTheme = useCallback(async (themeId: string, cost: number): Promise<boolean> => {
    if (!user) return false;
    setSavingPreferenceType('unlockedThemes');
    setIsSaving(true);
    if ((preferences.totalPoints || 0) < cost) {
        setIsSaving(false); setSavingPreferenceType(null);
        return false;
    }
    const docRef = getPreferencesDocRef();
    if (!docRef) { setIsSaving(false); setSavingPreferenceType(null); return false; }

    try {
        await updateDoc(docRef, {
            totalPoints: increment(-cost),
            unlockedThemeIds: arrayUnion(themeId)
        });
        setPreferences(prev => ({
            ...prev,
            totalPoints: (prev.totalPoints || 0) - cost,
            unlockedThemeIds: [...(prev.unlockedThemeIds || []), themeId]
        }));
        return true;
    } catch (error) {
        console.error("Failed to unlock theme:", error);
        return false;
    } finally {
        setIsSaving(false); setSavingPreferenceType(null);
    }
  }, [user, preferences.totalPoints, preferences.unlockedThemeIds, getPreferencesDocRef]);

  const purchaseSymbolicGift = useCallback(async (itemId: string, cost: number, itemName: string): Promise<boolean> => {
    if (!user) return false;
    setSavingPreferenceType('symbolicGift');
    setIsSaving(true);
    if ((preferences.totalPoints || 0) < cost) {
        setIsSaving(false); setSavingPreferenceType(null);
        return false;
    }
    const docRef = getPreferencesDocRef();
    if (!docRef) { setIsSaving(false); setSavingPreferenceType(null); return false; }

    try {
        await updateDoc(docRef, { totalPoints: increment(-cost) });
        setPreferences(prev => ({ ...prev, totalPoints: (prev.totalPoints || 0) - cost }));
        return true;
    } catch (error) {
        console.error(`Failed to purchase symbolic gift ${itemName}:`, error);
        return false;
    } finally {
        setIsSaving(false); setSavingPreferenceType(null);
    }
  }, [user, preferences.totalPoints, getPreferencesDocRef]);

  const setActiveCustomTheme = useCallback(async (themeId: string | null) => {
    await updatePreference({ activeCustomThemeId: themeId }, 'activeTheme');
  }, [updatePreference]);

  const setLastChallengeCompletedTimestamp = useCallback(async () => {
    if (!user) return;
    const timestamp = Timestamp.now();
     await updatePreference({ lastChallengeCompletedAt: timestamp }, 'lastChallengeCompletion');
  }, [user, updatePreference]);

  const updateOnboardingStatus = useCallback(async (completed: boolean) => {
    await updatePreference({ onboardingCompleted: completed }, 'onboardingCompleted');
  }, [updatePreference]);

  const updateFrequency = async (newFrequency: NotificationFrequency) => await updatePreference({ frequency: newFrequency }, 'frequency');
  const updateContentStyle = async (newContentStyle: ContentStyle) => await updatePreference({ contentStyle: newContentStyle }, 'contentStyle');
  const updateChallengeReminders = async (enabled: boolean) => await updatePreference({ enableChallengeReminders: enabled }, 'challengeReminders');
  const updateWeeklyDigest = async (enabled: boolean) => await updatePreference({ enableWeeklyDigest: enabled }, 'weeklyDigest');

  return {
    preferences,
    updateFrequency,
    updateContentStyle,
    updateChallengeReminders,
    updateWeeklyDigest,
    updateOnboardingStatus,
    awardPoints,
    unlockExclusiveSeries,
    unlockTheme,
    purchaseSymbolicGift,
    setActiveCustomTheme,
    recordEngagingActionForStreak,
    setLastChallengeCompletedTimestamp,
    isLoaded,
    isSaving,
    savingPreferenceType
  };
}
