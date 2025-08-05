import * as Sentry from '@sentry/nextjs';
import { trackError } from '@/lib/analytics/analytics-service';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error context interface
export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  page?: string;
  action?: string;
  component?: string;
  additionalData?: Record<string, any>;
}

// Error tracking configuration
export interface ErrorTrackingConfig {
  enableSentry: boolean;
  enableAnalytics: boolean;
  enableConsole: boolean;
  enableUserFeedback: boolean;
  environment: 'development' | 'staging' | 'production';
}

// Default configuration
const defaultConfig: ErrorTrackingConfig = {
  enableSentry: true,
  enableAnalytics: true,
  enableConsole: process.env.NODE_ENV === 'development',
  enableUserFeedback: true,
  environment: (process.env.NODE_ENV as any) || 'development',
};

class ErrorTrackingService {
  private config: ErrorTrackingConfig;
  private errorCount: Map<string, number> = new Map();
  private readonly MAX_ERRORS_PER_MINUTE = 10;

  constructor(config: Partial<ErrorTrackingConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initializeSentry();
  }

  private initializeSentry() {
    if (!this.config.enableSentry) return;

    try {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: this.config.environment,
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        beforeSend(event) {
          // Filter out certain errors in development
          if (process.env.NODE_ENV === 'development') {
            // Don't send console errors in development
            if (event.exception?.values?.[0]?.type === 'Error') {
              return null;
            }
          }
          return event;
        },
      });
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  // Track JavaScript errors
  public trackError(
    error: Error | string,
    context?: ErrorContext,
    severity: ErrorSeverity = 'medium'
  ) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorKey = `${errorMessage}_${context?.page || 'unknown'}`;

    // Rate limiting
    if (this.shouldRateLimit(errorKey)) {
      return;
    }

    // Console logging
    if (this.config.enableConsole) {
      console.error('Error tracked:', {
        message: errorMessage,
        severity,
        context,
        timestamp: new Date().toISOString(),
      });
    }

    // Sentry tracking
    if (this.config.enableSentry) {
      try {
        Sentry.withScope((scope) => {
          scope.setLevel(this.mapSeverityToSentryLevel(severity));
          scope.setTag('severity', severity);
          scope.setTag('environment', this.config.environment);
          
          if (context?.userId) {
            scope.setUser({ id: context.userId, email: context.userEmail });
          }
          
          if (context?.page) {
            scope.setTag('page', context.page);
          }
          
          if (context?.action) {
            scope.setTag('action', context.action);
          }
          
          if (context?.component) {
            scope.setTag('component', context.component);
          }
          
          if (context?.additionalData) {
            scope.setExtras(context.additionalData);
          }

          if (typeof error === 'string') {
            Sentry.captureMessage(errorMessage);
          } else {
            Sentry.captureException(error);
          }
        });
      } catch (sentryError) {
        console.error('Failed to send error to Sentry:', sentryError);
      }
    }

    // Analytics tracking
    if (this.config.enableAnalytics) {
      try {
        trackError(
          typeof error === 'string' ? 'string_error' : error.constructor.name,
          errorMessage,
          error instanceof Error ? error.stack : undefined
        );
      } catch (analyticsError) {
        console.error('Failed to track error in analytics:', analyticsError);
      }
    }
  }

  // Track API errors
  public trackApiError(
    endpoint: string,
    statusCode: number,
    response?: any,
    context?: ErrorContext
  ) {
    const severity = this.getApiErrorSeverity(statusCode);
    const errorMessage = `API Error: ${statusCode} - ${endpoint}`;

    this.trackError(errorMessage, {
      ...context,
      additionalData: {
        endpoint,
        statusCode,
        response: response ? JSON.stringify(response) : undefined,
      },
    }, severity);
  }

  // Track React component errors
  public trackReactError(
    error: Error,
    errorInfo: React.ErrorInfo,
    context?: ErrorContext
  ) {
    this.trackError(error, {
      ...context,
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    }, 'high');
  }

  // Track performance errors
  public trackPerformanceError(
    metric: string,
    value: number,
    threshold: number,
    context?: ErrorContext
  ) {
    const errorMessage = `Performance threshold exceeded: ${metric} = ${value} (threshold: ${threshold})`;
    
    this.trackError(errorMessage, {
      ...context,
      additionalData: {
        metric,
        value,
        threshold,
        type: 'performance',
      },
    }, 'medium');
  }

  // Track user feedback
  public trackUserFeedback(
    feedback: string,
    rating?: number,
    context?: ErrorContext
  ) {
    if (!this.config.enableUserFeedback) return;

    try {
      Sentry.captureFeedback({
        email: context?.userEmail || 'anonymous@user.com',
        name: context?.userId || 'Anonymous User',
        message: feedback,
      });
    } catch (error) {
      console.error('Failed to capture user feedback:', error);
    }
  }

  // Set user context for error tracking
  public setUserContext(userId: string, email?: string, additionalData?: Record<string, any>) {
    try {
      Sentry.setUser({
        id: userId,
        email,
        ...additionalData,
      });
    } catch (error) {
      console.error('Failed to set user context:', error);
    }
  }

  // Set global context
  public setGlobalContext(context: Record<string, any>) {
    try {
      Sentry.setContext('app', context);
    } catch (error) {
      console.error('Failed to set global context:', error);
    }
  }

  // Add breadcrumb for debugging
  public addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, any>,
    level: Sentry.SeverityLevel = 'info'
  ) {
    try {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level,
        timestamp: Date.now() / 1000,
      });
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  // Start performance monitoring
  public startPerformanceMonitoring(operation: string) {
    // Temporarily disabled due to Sentry API changes
    console.log(`Performance monitoring started for: ${operation}`);
    return null;
  }

  // Rate limiting helper
  private shouldRateLimit(errorKey: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    
    // Clean old entries
    const entries = Array.from(this.errorCount.entries());
    for (const [key, timestamp] of entries) {
      if (timestamp < oneMinuteAgo) {
        this.errorCount.delete(key);
      }
    }
    
    const currentCount = this.errorCount.get(errorKey) || 0;
    if (currentCount >= this.MAX_ERRORS_PER_MINUTE) {
      return true;
    }
    
    this.errorCount.set(errorKey, now);
    return false;
  }

  // Map severity to Sentry level
  private mapSeverityToSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'fatal';
      default:
        return 'error';
    }
  }

  // Get API error severity based on status code
  private getApiErrorSeverity(statusCode: number): ErrorSeverity {
    if (statusCode >= 500) return 'high';
    if (statusCode >= 400) return 'medium';
    return 'low';
  }

  // Get error statistics
  public getErrorStats() {
    return {
      totalErrors: this.errorCount.size,
      errorsInLastMinute: Array.from(this.errorCount.values()).filter(
        timestamp => timestamp > Date.now() - 60 * 1000
      ).length,
    };
  }

  // Clear error statistics
  public clearErrorStats() {
    this.errorCount.clear();
  }
}

// Create singleton instance
export const errorTrackingService = new ErrorTrackingService();

// Export convenience functions
export const trackErrorWithContext = (
  error: Error | string,
  context?: ErrorContext,
  severity?: ErrorSeverity
) => errorTrackingService.trackError(error, context, severity);

export const trackApiErrorWithContext = (
  endpoint: string,
  statusCode: number,
  response?: any,
  context?: ErrorContext
) => errorTrackingService.trackApiError(endpoint, statusCode, response, context);

export const trackReactErrorWithContext = (
  error: Error,
  errorInfo: React.ErrorInfo,
  context?: ErrorContext
) => errorTrackingService.trackReactError(error, errorInfo, context);

export const setUserContextForErrors = (
  userId: string,
  email?: string,
  additionalData?: Record<string, any>
) => errorTrackingService.setUserContext(userId, email, additionalData);

export const addErrorBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>,
  level?: Sentry.SeverityLevel
) => errorTrackingService.addBreadcrumb(message, category, data, level);

export default errorTrackingService; 