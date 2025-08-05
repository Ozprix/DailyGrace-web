import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/auth-context';
import {
  trackPageView,
  trackUserEngagement,
  trackFeatureUsage,
  trackContentInteraction,
  trackPerformance,
  trackError,
  trackConversion,
  trackUserJourney,
  setUserAnalyticsProperties,
  setUserAnalyticsId,
  trackSessionStart,
  trackCoreWebVitals,
  initializeUserAnalytics,
} from '@/lib/analytics/analytics-service';

export const useAnalytics = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Initialize analytics on mount
  useEffect(() => {
    if (user) {
      initializeUserAnalytics();
      trackSessionStart();
    }
    
    // Track Core Web Vitals
    trackCoreWebVitals();
  }, [user]);

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const pageName = url.split('?')[0]; // Remove query parameters
      trackPageView(pageName, document.title);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Track initial page view
    if (router.isReady) {
      trackPageView(router.pathname, document.title);
    }

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // Track user engagement
  const trackEngagement = useCallback((
    action: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    trackUserEngagement(action, category, label, value);
  }, []);

  // Track feature usage
  const trackFeature = useCallback((
    featureName: string,
    action: string,
    details?: Record<string, any>
  ) => {
    trackFeatureUsage(featureName, action, details);
  }, []);

  // Track content interactions
  const trackContent = useCallback((
    contentType: 'devotional' | 'prayer' | 'journal' | 'quiz' | 'reading_plan',
    action: 'view' | 'like' | 'share' | 'save' | 'complete',
    contentId?: string,
    contentTitle?: string
  ) => {
    trackContentInteraction(contentType, action, contentId, contentTitle);
  }, []);

  // Track performance metrics
  const trackPerf = useCallback((
    metric: string,
    value: number,
    unit?: string
  ) => {
    trackPerformance(metric, value, unit);
  }, []);

  // Track errors
  const trackErr = useCallback((
    errorType: string,
    errorMessage: string,
    errorStack?: string
  ) => {
    trackError(errorType, errorMessage, errorStack);
  }, []);

  // Track conversions
  const trackConv = useCallback((
    conversionType: 'subscription' | 'purchase' | 'signup' | 'upgrade',
    value?: number,
    currency?: string
  ) => {
    trackConversion(conversionType, value, currency);
  }, []);

  // Track user journey
  const trackJourney = useCallback((
    step: string,
    journeyName: string,
    stepNumber?: number
  ) => {
    trackUserJourney(step, journeyName, stepNumber);
  }, []);

  // Set user properties
  const setUserProps = useCallback((properties: any) => {
    setUserAnalyticsProperties(properties);
  }, []);

  // Set user ID
  const setUserId = useCallback((userId: string) => {
    setUserAnalyticsId(userId);
  }, []);

  return {
    trackEngagement,
    trackFeature,
    trackContent,
    trackPerf,
    trackErr,
    trackConv,
    trackJourney,
    setUserProps,
    setUserId,
  };
};

// Specific analytics hooks for different features
export const useDevotionalAnalytics = () => {
  const { trackContent, trackEngagement } = useAnalytics();

  const trackDevotionalView = useCallback((devotionalId: string, title: string) => {
    trackContent('devotional', 'view', devotionalId, title);
  }, [trackContent]);

  const trackDevotionalLike = useCallback((devotionalId: string, title: string) => {
    trackContent('devotional', 'like', devotionalId, title);
    trackEngagement('like', 'devotional', title);
  }, [trackContent, trackEngagement]);

  const trackDevotionalShare = useCallback((devotionalId: string, title: string, platform: string) => {
    trackContent('devotional', 'share', devotionalId, title);
    trackEngagement('share', 'devotional', `${title}_${platform}`);
  }, [trackContent, trackEngagement]);

  const trackDevotionalSave = useCallback((devotionalId: string, title: string) => {
    trackContent('devotional', 'save', devotionalId, title);
    trackEngagement('save', 'devotional', title);
  }, [trackContent, trackEngagement]);

  return {
    trackDevotionalView,
    trackDevotionalLike,
    trackDevotionalShare,
    trackDevotionalSave,
  };
};

export const usePrayerAnalytics = () => {
  const { trackContent, trackEngagement } = useAnalytics();

  const trackPrayerView = useCallback((prayerId: string, title: string) => {
    trackContent('prayer', 'view', prayerId, title);
  }, [trackContent]);

  const trackPrayerSubmit = useCallback((prayerId: string, title: string) => {
    trackContent('prayer', 'complete', prayerId, title);
    trackEngagement('submit', 'prayer', title);
  }, [trackContent, trackEngagement]);

  const trackPrayerShare = useCallback((prayerId: string, title: string, platform: string) => {
    trackContent('prayer', 'share', prayerId, title);
    trackEngagement('share', 'prayer', `${title}_${platform}`);
  }, [trackContent, trackEngagement]);

  return {
    trackPrayerView,
    trackPrayerSubmit,
    trackPrayerShare,
  };
};

export const useJournalAnalytics = () => {
  const { trackContent, trackEngagement } = useAnalytics();

  const trackJournalEntry = useCallback((entryId: string, mood?: string) => {
    trackContent('journal', 'complete', entryId, 'journal_entry');
    trackEngagement('write', 'journal', mood || 'no_mood');
  }, [trackContent, trackEngagement]);

  const trackJournalView = useCallback((entryId: string) => {
    trackContent('journal', 'view', entryId, 'journal_entry');
  }, [trackContent]);

  const trackJournalShare = useCallback((entryId: string, platform: string) => {
    trackContent('journal', 'share', entryId, 'journal_entry');
    trackEngagement('share', 'journal', platform);
  }, [trackContent, trackEngagement]);

  return {
    trackJournalEntry,
    trackJournalView,
    trackJournalShare,
  };
};

export const useQuizAnalytics = () => {
  const { trackContent, trackEngagement } = useAnalytics();

  const trackQuizStart = useCallback((quizId: string, category: string) => {
    trackContent('quiz', 'view', quizId, category);
    trackEngagement('start', 'quiz', category);
  }, [trackContent, trackEngagement]);

  const trackQuizComplete = useCallback((quizId: string, category: string, score: number) => {
    trackContent('quiz', 'complete', quizId, category);
    trackEngagement('complete', 'quiz', category, score);
  }, [trackContent, trackEngagement]);

  const trackQuizQuestion = useCallback((quizId: string, questionNumber: number, isCorrect: boolean) => {
    trackEngagement('answer', 'quiz_question', `${quizId}_q${questionNumber}`, isCorrect ? 1 : 0);
  }, [trackEngagement]);

  return {
    trackQuizStart,
    trackQuizComplete,
    trackQuizQuestion,
  };
};

export const useReadingPlanAnalytics = () => {
  const { trackContent, trackEngagement } = useAnalytics();

  const trackPlanStart = useCallback((planId: string, planName: string) => {
    trackContent('reading_plan', 'view', planId, planName);
    trackEngagement('start', 'reading_plan', planName);
  }, [trackContent, trackEngagement]);

  const trackPlanComplete = useCallback((planId: string, planName: string) => {
    trackContent('reading_plan', 'complete', planId, planName);
    trackEngagement('complete', 'reading_plan', planName);
  }, [trackContent, trackEngagement]);

  const trackDayComplete = useCallback((planId: string, dayNumber: number) => {
    trackEngagement('complete_day', 'reading_plan', `${planId}_day_${dayNumber}`);
  }, [trackEngagement]);

  return {
    trackPlanStart,
    trackPlanComplete,
    trackDayComplete,
  };
};

export default useAnalytics; 