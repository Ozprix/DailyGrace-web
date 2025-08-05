'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug, X } from 'lucide-react';
import { trackReactErrorWithContext } from '@/lib/error-tracking/error-service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: any[];
  pageName?: string;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track error with context
    trackReactErrorWithContext(error, errorInfo, {
      page: this.props.pageName,
      component: this.props.componentName,
      additionalData: {
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
      },
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when resetKeys change
    if (this.state.hasError && this.props.resetKeys !== prevProps.resetKeys) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        errorId: '',
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: '',
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    if (!error) return;

    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      page: this.props.pageName,
      component: this.props.componentName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // You can send this to your error reporting service
    console.error('Error Report:', errorReport);
    
    // For now, we'll just show a message
    alert('Error report generated. Please contact support with the error details.');
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails, errorId } = this.state;

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Card className="shadow-lg border-red-200">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Something went wrong
                </CardTitle>
                <CardDescription className="text-gray-600">
                  We're sorry, but something unexpected happened. Our team has been notified.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Error ID for support */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Error ID: <code className="bg-gray-200 px-2 py-1 rounded">{errorId}</code>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Please include this ID when contacting support.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                  
                  <Button 
                    onClick={this.handleReportError}
                    variant="outline"
                    className="flex-1"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Report Error
                  </Button>
                </div>

                {/* Error Details Toggle */}
                <div className="border-t pt-4">
                  <Button
                    onClick={this.toggleDetails}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    {showDetails ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Hide Error Details
                      </>
                    ) : (
                      <>
                        <Bug className="w-4 h-4 mr-2" />
                        Show Error Details
                      </>
                    )}
                  </Button>
                </div>

                {/* Error Details */}
                {showDetails && error && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Error Message:</h4>
                      <pre className="text-sm text-red-600 bg-red-50 p-3 rounded overflow-x-auto">
                        {error.message}
                      </pre>
                    </div>
                    
                    {error.stack && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Stack Trace:</h4>
                        <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-x-auto max-h-40">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {errorInfo?.componentStack && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Component Stack:</h4>
                        <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-x-auto max-h-40">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Helpful Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">What you can do:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Try refreshing the page</li>
                    <li>• Clear your browser cache and cookies</li>
                    <li>• Check your internet connection</li>
                    <li>• Contact support if the problem persists</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
      trackReactErrorWithContext(event.error, {
        componentStack: event.filename,
      } as any, {
        additionalData: {
          type: 'unhandled_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      setError(error);
      trackReactErrorWithContext(error, {
        componentStack: 'Promise rejection',
      } as any, {
        additionalData: {
          type: 'unhandled_rejection',
          reason: event.reason,
        },
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return { error, setError };
}

export default ErrorBoundary; 