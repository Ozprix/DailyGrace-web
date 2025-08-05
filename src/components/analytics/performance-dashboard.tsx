'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Zap, Clock, Target } from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';

interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  timestamp: string;
}

interface CoreWebVitals {
  lcp: 'good' | 'needs-improvement' | 'poor';
  fid: 'good' | 'needs-improvement' | 'poor';
  cls: 'good' | 'needs-improvement' | 'poor';
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { trackPerf } = useAnalytics();

  const getVitalStatus = (metric: string, value: number): CoreWebVitals[keyof CoreWebVitals] => {
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      default:
        return 'good';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'needs-improvement':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <TrendingUp className="w-4 h-4" />;
      case 'needs-improvement':
        return <Activity className="w-4 h-4" />;
      case 'poor':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const measurePerformance = async () => {
    setIsLoading(true);
    
    try {
      // Measure Core Web Vitals
      const performanceData = await new Promise<PerformanceMetrics>((resolve) => {
        if ('PerformanceObserver' in window) {
          let lcpValue = 0;
          let fidValue = 0;
          let clsValue = 0;
          let fcpValue = 0;
          let ttfbValue = 0;

          // LCP
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcpValue = lastEntry.startTime;
            trackPerf('lcp', lcpValue, 'ms');
          });

          // FID
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              fidValue = entry.processingStart - entry.startTime;
              trackPerf('fid', fidValue, 'ms');
            });
          });

          // CLS
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            trackPerf('cls', clsValue);
          });

          // FCP
          const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const firstEntry = entries[0];
            fcpValue = firstEntry.startTime;
            trackPerf('fcp', fcpValue, 'ms');
          });

          // TTFB
          const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigationEntry) {
            ttfbValue = navigationEntry.responseStart - navigationEntry.requestStart;
            trackPerf('ttfb', ttfbValue, 'ms');
          }

          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          fidObserver.observe({ entryTypes: ['first-input'] });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
          fcpObserver.observe({ entryTypes: ['first-contentful-paint'] });

          // Wait a bit for metrics to be collected
          setTimeout(() => {
            lcpObserver.disconnect();
            fidObserver.disconnect();
            clsObserver.disconnect();
            fcpObserver.disconnect();

            resolve({
              lcp: lcpValue,
              fid: fidValue,
              cls: clsValue,
              fcp: fcpValue,
              ttfb: ttfbValue,
              timestamp: new Date().toISOString(),
            });
          }, 2000);
        } else {
          resolve({
            lcp: 0,
            fid: 0,
            cls: 0,
            fcp: 0,
            ttfb: 0,
            timestamp: new Date().toISOString(),
          });
        }
      });

      setMetrics(performanceData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error measuring performance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    measurePerformance();
  }, []);

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Dashboard
          </CardTitle>
          <CardDescription>
            Loading performance metrics...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const lcpStatus = getVitalStatus('lcp', metrics.lcp);
  const fidStatus = getVitalStatus('fid', metrics.fid);
  const clsStatus = getVitalStatus('cls', metrics.cls);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Performance Dashboard
              </CardTitle>
              <CardDescription>
                Real-time Core Web Vitals and performance metrics
              </CardDescription>
            </div>
            <Button
              onClick={measurePerformance}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* LCP */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">LCP</CardTitle>
              <Badge className={getStatusColor(lcpStatus)}>
                {getStatusIcon(lcpStatus)}
                <span className="ml-1">{lcpStatus}</span>
              </Badge>
            </div>
            <CardDescription>Largest Contentful Paint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.lcp)}ms</div>
            <Progress 
              value={Math.min((metrics.lcp / 4000) * 100, 100)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: &lt; 2.5s
            </p>
          </CardContent>
        </Card>

        {/* FID */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">FID</CardTitle>
              <Badge className={getStatusColor(fidStatus)}>
                {getStatusIcon(fidStatus)}
                <span className="ml-1">{fidStatus}</span>
              </Badge>
            </div>
            <CardDescription>First Input Delay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.fid)}ms</div>
            <Progress 
              value={Math.min((metrics.fid / 300) * 100, 100)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: &lt; 100ms
            </p>
          </CardContent>
        </Card>

        {/* CLS */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">CLS</CardTitle>
              <Badge className={getStatusColor(clsStatus)}>
                {getStatusIcon(clsStatus)}
                <span className="ml-1">{clsStatus}</span>
              </Badge>
            </div>
            <CardDescription>Cumulative Layout Shift</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cls.toFixed(3)}</div>
            <Progress 
              value={Math.min((metrics.cls / 0.25) * 100, 100)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: &lt; 0.1
            </p>
          </CardContent>
        </Card>

        {/* FCP */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              FCP
            </CardTitle>
            <CardDescription>First Contentful Paint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.fcp)}ms</div>
            <Progress 
              value={Math.min((metrics.fcp / 1800) * 100, 100)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: &lt; 1.8s
            </p>
          </CardContent>
        </Card>

        {/* TTFB */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              TTFB
            </CardTitle>
            <CardDescription>Time to First Byte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.ttfb)}ms</div>
            <Progress 
              value={Math.min((metrics.ttfb / 600) * 100, 100)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: &lt; 600ms
            </p>
          </CardContent>
        </Card>

        {/* Overall Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Overall Score
            </CardTitle>
            <CardDescription>Performance Rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                ((lcpStatus === 'good' ? 1 : lcpStatus === 'needs-improvement' ? 0.5 : 0) +
                 (fidStatus === 'good' ? 1 : fidStatus === 'needs-improvement' ? 0.5 : 0) +
                 (clsStatus === 'good' ? 1 : clsStatus === 'needs-improvement' ? 0.5 : 0)) / 3 * 100
              )}%
            </div>
            <Progress 
              value={
                ((lcpStatus === 'good' ? 1 : lcpStatus === 'needs-improvement' ? 0.5 : 0) +
                 (fidStatus === 'good' ? 1 : fidStatus === 'needs-improvement' ? 0.5 : 0) +
                 (clsStatus === 'good' ? 1 : clsStatus === 'needs-improvement' ? 0.5 : 0)) / 3 * 100
              } 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Based on Core Web Vitals
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PerformanceDashboard; 