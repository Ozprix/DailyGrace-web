'use client';

import { useEffect, useRef } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';

interface UserBehaviorTrackerProps {
  pageName: string;
  contentId?: string;
  contentType?: 'devotional' | 'prayer' | 'journal' | 'quiz' | 'reading_plan';
}

export function UserBehaviorTracker({ 
  pageName, 
  contentId, 
  contentType 
}: UserBehaviorTrackerProps) {
  const { trackEngagement, trackContent } = useAnalytics();
  const startTime = useRef<number>(Date.now());
  const isVisible = useRef<boolean>(true);
  const scrollDepth = useRef<number>(0);
  const interactionCount = useRef<number>(0);

  useEffect(() => {
    // Track page view
    trackEngagement('view', 'page', pageName);

    // Track content view if contentId is provided
    if (contentId && contentType) {
      trackContent(contentType, 'view', contentId, pageName);
    }

    // Track scroll depth
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const newScrollDepth = Math.round((scrollTop / scrollHeight) * 100);
      
      if (newScrollDepth > scrollDepth.current) {
        scrollDepth.current = newScrollDepth;
        
        // Track scroll milestones
        if (newScrollDepth >= 25 && scrollDepth.current < 25) {
          trackEngagement('scroll', 'page', `${pageName}_25%`);
        }
        if (newScrollDepth >= 50 && scrollDepth.current < 50) {
          trackEngagement('scroll', 'page', `${pageName}_50%`);
        }
        if (newScrollDepth >= 75 && scrollDepth.current < 75) {
          trackEngagement('scroll', 'page', `${pageName}_75%`);
        }
        if (newScrollDepth >= 90 && scrollDepth.current < 90) {
          trackEngagement('scroll', 'page', `${pageName}_90%`);
        }
      }
    };

    // Track visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible.current = false;
        trackEngagement('hide', 'page', pageName);
      } else {
        isVisible.current = true;
        trackEngagement('show', 'page', pageName);
      }
    };

    // Track user interactions
    const handleInteraction = () => {
      interactionCount.current++;
      
      // Track interaction milestones
      if (interactionCount.current === 1) {
        trackEngagement('interact', 'page', `${pageName}_first_interaction`);
      }
      if (interactionCount.current === 5) {
        trackEngagement('interact', 'page', `${pageName}_engaged_user`);
      }
      if (interactionCount.current === 10) {
        trackEngagement('interact', 'page', `${pageName}_highly_engaged`);
      }
    };

    // Track time on page
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - startTime.current;
      trackEngagement('time_on_page', 'page', pageName, Math.round(timeOnPage / 1000));
    };

    // Track mouse movements (heatmap-like data)
    const handleMouseMove = (event: MouseEvent) => {
      const x = Math.round((event.clientX / window.innerWidth) * 100);
      const y = Math.round((event.clientY / window.innerHeight) * 100);
      
      // Track mouse position every 10 seconds
      if (Date.now() % 10000 < 16) { // ~10 seconds
        trackEngagement('mouse_position', 'page', `${pageName}_${x}_${y}`);
      }
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Track engagement every 30 seconds
    const engagementInterval = setInterval(() => {
      if (isVisible.current) {
        trackEngagement('engaged_time', 'page', pageName, 30);
      }
    }, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(engagementInterval);

      // Track final engagement metrics
      const totalTime = Date.now() - startTime.current;
      const finalScrollDepth = scrollDepth.current;
      const finalInteractionCount = interactionCount.current;

      trackEngagement('page_exit', 'page', pageName, Math.round(totalTime / 1000));
      trackEngagement('final_scroll_depth', 'page', pageName, finalScrollDepth);
      trackEngagement('total_interactions', 'page', pageName, finalInteractionCount);
    };
  }, [pageName, contentId, contentType, trackEngagement, trackContent]);

  // This component doesn't render anything
  return null;
}

export default UserBehaviorTracker; 