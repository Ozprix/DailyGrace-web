'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { trackSessionStart, trackCoreWebVitals } from '@/lib/analytics/analytics-service';

export default function AnalyticsInitializer() {
  const { setUserId } = useAnalytics();

  useEffect(() => {
    // Initialize analytics on app load
    trackSessionStart();
    trackCoreWebVitals();
  }, []);

  return null;
} 