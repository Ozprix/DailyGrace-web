// src/hooks/use-reading-plans.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useContent } from '@/contexts/content-context';
import {
  getUserReadingProgress,
  createUserReadingProgress,
  updateUserReadingProgress,
  getAllUserProgress, // New function to get all progress docs for a user
} from '@/services/reading-plan.service';
import type { ReadingPlan, UserReadingProgress } from '@/types/reading-plan';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { useToast } from './use-toast';

export function useReadingPlans() {
  const { user, loading: authLoading } = useAuth();
  const { allReadingPlans, isLoadingContent } = useContent();
  const [userProgressMap, setUserProgressMap] = useState<Map<string, UserReadingProgress>>(new Map());
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const { toast } = useToast();

  const fetchAllProgress = useCallback(async () => {
    if (!user) {
      setUserProgressMap(new Map());
      setIsLoadingProgress(false);
      return;
    }
    
    setIsLoadingProgress(true);
    try {
      const allProgressDocs = await getAllUserProgress(user.uid);
      const progressMap = new Map<string, UserReadingProgress>();
      allProgressDocs.forEach(progress => {
        progressMap.set(progress.readingPlanId, progress);
      });
      setUserProgressMap(progressMap);
    } catch (error) {
      console.error("Failed to fetch all user reading progress:", error);
      toast({ title: "Error", description: "Could not load your reading plan progress." });
    } finally {
      setIsLoadingProgress(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) {
      fetchAllProgress();
    }
  }, [authLoading, fetchAllProgress]);

  const startReadingPlan = useCallback(async (planId: string): Promise<UserReadingProgress | null> => {
    if (!user) {
      toast({ title: 'Please log in to start a plan.', variant: 'default' });
      return null;
    }
    try {
      const newProgress = await createUserReadingProgress(user.uid, planId);
      setUserProgressMap(prev => new Map(prev).set(planId, newProgress));
      const plan = allReadingPlans.find(p => p.id === planId);
      if (analytics && plan) {
        logEvent(analytics, 'reading_plan_started', { plan_id: planId, plan_name: plan.name });
      }
      return newProgress;
    } catch (error) {
      console.error('Failed to start reading plan:', error);
      toast({ title: 'Error', description: 'Could not start the reading plan.', variant: 'destructive' });
      return null;
    }
  }, [user, allReadingPlans, toast]);

  const updateProgress = useCallback(async (progressId: string, updates: Partial<UserReadingProgress>): Promise<boolean> => {
    try {
      await updateUserReadingProgress(progressId, updates);
      // Refetch for consistency, or optimistically update
      const planId = progressId.split('_')[1];
      if (user) {
        const updatedProgress = await getUserReadingProgress(user.uid, planId);
        if (updatedProgress) {
          setUserProgressMap(prev => new Map(prev).set(planId, updatedProgress));
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to update reading progress:', error);
      toast({ title: 'Error', description: 'Could not save your progress.', variant: 'destructive' });
      return false;
    }
  }, [user, toast]);

  return {
    allReadingPlans,
    userProgressMap,
    isLoading: authLoading || isLoadingContent || isLoadingProgress,
    startReadingPlan,
    updateProgress,
    refetchAllProgress: fetchAllProgress,
  };
}
