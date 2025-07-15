
// src/hooks/use-user-challenges.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db, analytics } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, arrayUnion, updateDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import type { UserChallengeStatus, Challenge } from '@/types';
import { useContent } from '@/contexts/content-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';

const CHALLENGE_COMPLETION_POINTS = 50;

export function useUserChallenges() {
  const { user } = useAuth();
  const { getChallengeById } = useContent();
  const { preferences, awardPoints, isLoaded: preferencesLoaded, setLastChallengeCompletedTimestamp } = useUserPreferences();
  const [startedChallengeIds, setStartedChallengeIds] = useState<Set<string>>(new Set());
  const [challengeProgressCache, setChallengeProgressCache] = useState<Map<string, UserChallengeStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingProgress, setIsFetchingProgress] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  const activeChallenges = Array.from(challengeProgressCache.values())
    .filter(p => p.status === 'active')
    .map(p => {
      const challengeDetails = getChallengeById(p.challengeId);
      return {
        ...p,
        challengeName: challengeDetails?.name || 'Challenge',
        totalDays: challengeDetails?.durationDays || 0
      };
    })
    .sort((a, b) => (b.lastDayCompletedAt?.toMillis() || b.startedAt.toMillis()) - (a.lastDayCompletedAt?.toMillis() || a.startedAt.toMillis()));

  const fetchChallengeProgress = useCallback(async (challengeId: string): Promise<UserChallengeStatus | null> => {
    if (!user?.uid) return null;
    
    setIsFetchingProgress(true);
    const progressDocRef = doc(db, 'users', user.uid, 'userChallengeData', challengeId);
    try {
      const docSnap = await getDoc(progressDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserChallengeStatus;
        setChallengeProgressCache(prev => new Map(prev).set(challengeId, data));
        return data;
      } else {
        setChallengeProgressCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(challengeId);
          return newCache;
        });
        return null;
      }
    } catch (error) {
      console.error(`Failed to fetch progress for challenge ${challengeId}:`, error);
      if (analytics) {
        logEvent(analytics, 'fetch_challenge_progress_failed', { challenge_id: challengeId, error_message: (error as Error).message });
      }
      setChallengeProgressCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(challengeId);
        return newCache;
      });
      return null;
    } finally {
      setIsFetchingProgress(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    const loadUserChallengeIds = async () => {
      if (!user?.uid) {
        setStartedChallengeIds(new Set());
        setChallengeProgressCache(new Map());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const activeIds = userData.activeChallengeIds || [];
          setStartedChallengeIds(new Set(activeIds));
          // Pre-fetch progress for active challenges
          for (const id of activeIds) {
            await fetchChallengeProgress(id);
          }
        } else {
          setStartedChallengeIds(new Set());
        }
      } catch (error) {
        console.error("Failed to load user challenge IDs from Firestore:", error);
        setStartedChallengeIds(new Set());
        if (analytics) {
          logEvent(analytics, 'load_user_challenges_failed', { error_message: (error as Error).message });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserChallengeIds();
  }, [user?.uid, fetchChallengeProgress]);

  const getChallengeProgress = useCallback((challengeId: string): UserChallengeStatus | null => {
    return challengeProgressCache.get(challengeId) || null;
  }, [challengeProgressCache]);

  const startChallenge = useCallback(async (challengeId: string, challengeName: string) => {
    if (!user?.uid) {
      console.warn("User not logged in. Cannot start challenge.");
      return false;
    }
    
    const currentUserDocRef = doc(db, 'users', user.uid);

    if (startedChallengeIds.has(challengeId)) {
      let existingProgress: UserChallengeStatus | null | undefined = challengeProgressCache.get(challengeId);
      if (!existingProgress) {
        existingProgress = await fetchChallengeProgress(challengeId);
      }
      if (!existingProgress) {
         const progressDocRef = doc(db, 'users', user.uid, 'userChallengeData', challengeId);
         const newChallengeStatus: UserChallengeStatus = {
            challengeId,
            startedAt: Timestamp.now(),
            currentDay: 1,
            completedDays: [],
            status: 'active',
         };
         await setDoc(progressDocRef, newChallengeStatus);
         setChallengeProgressCache(prev => new Map(prev).set(challengeId, newChallengeStatus));
      }
      return true;
    }

    setIsUpdatingProgress(true);
    try {
      await setDoc(currentUserDocRef, { 
        activeChallengeIds: arrayUnion(challengeId) 
      }, { merge: true });

      const progressDocRef = doc(db, 'users', user.uid, 'userChallengeData', challengeId);
      const newChallengeStatus: UserChallengeStatus = {
        challengeId,
        startedAt: Timestamp.now(),
        currentDay: 1,
        completedDays: [],
        status: 'active',
      };
      await setDoc(progressDocRef, newChallengeStatus);

      setStartedChallengeIds(prev => new Set(prev).add(challengeId));
      setChallengeProgressCache(prev => new Map(prev).set(challengeId, newChallengeStatus));

      if (analytics) {
        logEvent(analytics, 'challenge_started', {
          challenge_id: challengeId,
          challenge_name: challengeName,
        });
      }
      return true;
    } catch (error) {
      console.error(`Failed to start challenge ${challengeId} in Firestore:`, error);
      if (analytics) {
        logEvent(analytics, 'challenge_start_failed', {
          challenge_id: challengeId,
          challenge_name: challengeName,
          error_message: (error as Error).message,
        });
      }
      return false;
    } finally {
      setIsUpdatingProgress(false);
    }
  }, [user?.uid, startedChallengeIds, fetchChallengeProgress, challengeProgressCache]);
  
  const markDayAsComplete = useCallback(async (challengeId: string): Promise<boolean> => {
    if (!user?.uid || !preferencesLoaded) {
      console.warn("User not logged in or preferences not loaded. Cannot mark day complete.");
      return false;
    }
    setIsUpdatingProgress(true);

    const challenge = getChallengeById(challengeId);
    if (!challenge) {
      console.error(`Challenge details not found for ID: ${challengeId}`);
      setIsUpdatingProgress(false);
      return false;
    }

    const progressDocRef = doc(db, 'users', user.uid, 'userChallengeData', challengeId);
    let challengeJustCompleted = false;
    let dayMarked = 0;

    try {
      await runTransaction(db, async (transaction) => {
        const progressSnap = await transaction.get(progressDocRef);
        if (!progressSnap.exists()) {
          throw new Error("Challenge progress document does not exist.");
        }

        const currentProgress = progressSnap.data() as UserChallengeStatus;
        dayMarked = currentProgress.currentDay; 

        if (currentProgress.status !== 'active') {
          throw new Error("Challenge is not active.");
        }
        if (currentProgress.completedDays.includes(currentProgress.currentDay)) {
          console.log(`Day ${currentProgress.currentDay} of challenge ${challengeId} already marked complete.`);
          return; 
        }

        const newCompletedDays = [...currentProgress.completedDays, currentProgress.currentDay];
        const newCurrentDay = currentProgress.currentDay + 1;
        let newStatus: 'active' | 'completed' = 'active';

        if (newCurrentDay > challenge.durationDays) {
          newStatus = 'completed';
          challengeJustCompleted = true; 
        }
        
        const updatedProgressData: Partial<UserChallengeStatus> = {
          completedDays: newCompletedDays,
          currentDay: newStatus === 'completed' ? currentProgress.currentDay : newCurrentDay,
          status: newStatus,
          lastDayCompletedAt: Timestamp.now()
        };
        if (newStatus === 'completed') {
             updatedProgressData.currentDay = challenge.durationDays;
             setLastChallengeCompletedTimestamp();
        }

        transaction.update(progressDocRef, updatedProgressData);

        const updatedCacheData: UserChallengeStatus = { ...currentProgress, ...updatedProgressData };
         setChallengeProgressCache(prev => new Map(prev).set(challengeId, updatedCacheData));
      });

      if (analytics) {
        logEvent(analytics, 'day_marked_complete', {
          challenge_id: challengeId,
          day_number: dayMarked, 
        });
      }

      if (challengeJustCompleted) {
        if (analytics) {
            logEvent(analytics, 'challenge_completed', {
              challenge_id: challengeId,
              challenge_name: challenge.name,
            });
        }
        if (preferences.subscriptionStatus === 'premium') {
          const pointsAwarded = await awardPoints(CHALLENGE_COMPLETION_POINTS);
          if (pointsAwarded && analytics) {
            logEvent(analytics, 'points_awarded_for_challenge_completion', {
              challenge_id: challengeId,
              points: CHALLENGE_COMPLETION_POINTS,
            });
          }
        }
      }
      return true;
    } catch (error) {
      console.error(`Failed to mark day complete for challenge ${challengeId}:`, error);
       if (analytics) {
        logEvent(analytics, 'mark_day_complete_failed', {
          challenge_id: challengeId,
          day_number: dayMarked,
          error_message: (error as Error).message,
        });
      }
      return false;
    } finally {
      setIsUpdatingProgress(false);
    }
  }, [user?.uid, getChallengeById, preferencesLoaded, preferences.subscriptionStatus, awardPoints, setLastChallengeCompletedTimestamp]);


  const hasStartedChallenge = useCallback((challengeId: string): boolean => {
    return startedChallengeIds.has(challengeId);
  }, [startedChallengeIds]);

  return {
    startChallenge,
    hasStartedChallenge,
    isLoading,
    startedChallengeIds,
    fetchChallengeProgress,
    getChallengeProgress,
    isFetchingProgress,
    challengeProgressCache,
    markDayAsComplete,
    isUpdatingProgress,
    activeChallenges
  };
}
