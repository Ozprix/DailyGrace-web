import { analytics } from '@/lib/firebase/config';
import { logEvent, setUserId, setUserProperties, setCurrentScreen } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  userId?: string;
}

// User properties interface
export interface UserProperties {
  user_type?: 'free' | 'premium';
  subscription_status?: 'active' | 'inactive' | 'trial';
  device_type?: 'mobile' | 'desktop' | 'tablet';
  app_version?: string;
  last_login_date?: string;
  total_sessions?: number;
  favorite_features?: string[];
}

// Page view tracking
export const trackPageView = (pageName: string, pageTitle?: string) => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'page_view', {
      page_name: pageName,
      page_title: pageTitle || pageName,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
    });

    // Set current screen for mobile apps
    setCurrentScreen(analytics, pageName);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// User engagement tracking
export const trackUserEngagement = (action: string, category: string, label?: string, value?: number) => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'user_engagement', {
      action,
      category,
      label,
      value,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking user engagement:', error);
  }
};

// Feature usage tracking
export const trackFeatureUsage = (featureName: string, action: string, details?: Record<string, any>) => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'feature_usage', {
      feature_name: featureName,
      action,
      ...details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
  }
};

// Content interaction tracking
export const trackContentInteraction = (
  contentType: 'devotional' | 'prayer' | 'journal' | 'quiz' | 'reading_plan',
  action: 'view' | 'like' | 'share' | 'save' | 'complete',
  contentId?: string,
  contentTitle?: string
) => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'content_interaction', {
      content_type: contentType,
      action,
      content_id: contentId,
      content_title: contentTitle,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking content interaction:', error);
  }
};

// Performance tracking
export const trackPerformance = (metric: string, value: number, unit?: string) => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: unit,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking performance:', error);
  }
};

// Error tracking
export const trackError = (errorType: string, errorMessage: string, errorStack?: string) => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'app_error', {
      error_type: errorType,
      error_message: errorMessage,
      error_stack: errorStack,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking error:', error);
  }
};

// Conversion tracking
export const trackConversion = (
  conversionType: 'subscription' | 'purchase' | 'signup' | 'upgrade',
  value?: number,
  currency?: string
) => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'conversion', {
      conversion_type: conversionType,
      value,
      currency: currency || 'USD',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
};

// User journey tracking
export const trackUserJourney = (step: string, journeyName: string, stepNumber?: number) => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'user_journey', {
      journey_name: journeyName,
      step,
      step_number: stepNumber,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking user journey:', error);
  }
};

// Set user properties
export const setUserAnalyticsProperties = (properties: UserProperties) => {
  if (!analytics) return;

  try {
    setUserProperties(analytics, properties as Record<string, any>);
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
};

// Set user ID for tracking
export const setUserAnalyticsId = (userId: string) => {
  if (!analytics) return;

  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.error('Error setting user ID:', error);
  }
};

// Initialize user analytics
export const initializeUserAnalytics = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    setUserAnalyticsId(user.uid);
    
    // Set basic user properties
    setUserAnalyticsProperties({
      user_type: 'free', // This should be determined from user data
      device_type: getDeviceType(),
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      last_login_date: new Date().toISOString(),
    });
  }
};

// Get device type
const getDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
};

// Core Web Vitals tracking
export const trackCoreWebVitals = () => {
  if (typeof window === 'undefined' || !analytics) return;

  // Track LCP (Largest Contentful Paint)
  if ('PerformanceObserver' in window) {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      trackPerformance('lcp', lastEntry.startTime, 'ms');
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Track FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const eventEntry = entry as PerformanceEventTiming;
        if (eventEntry.processingStart) {
          trackPerformance('fid', eventEntry.processingStart - eventEntry.startTime, 'ms');
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Track CLS (Cumulative Layout Shift)
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      trackPerformance('cls', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
};

// Custom event tracking with enhanced parameters
export const trackCustomEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (!analytics) return;

  try {
    const enhancedParameters = {
      ...parameters,
      timestamp: new Date().toISOString(),
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : '',
    };

    logEvent(analytics, eventName, enhancedParameters);
  } catch (error) {
    console.error('Error tracking custom event:', error);
  }
};

// Session tracking
export const trackSessionStart = () => {
  if (!analytics) return;

  try {
    logEvent(analytics, 'session_start', {
      session_id: generateSessionId(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking session start:', error);
  }
};

// Generate unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Export analytics instance for direct use
export { analytics }; 