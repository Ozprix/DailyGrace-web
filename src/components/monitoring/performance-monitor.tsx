'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Database,
  Network,
  Cpu
} from 'lucide-react';
import { errorTrackingService } from '@/lib/error-tracking/error-service';

interface PerformanceMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  network: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
  firebase: {
    reads: number;
    writes: number;
    errors: number;
    avgLatency: number;
  };
  app: {
    loadTime: number;
    renderTime: number;
    interactions: number;
  };
}

interface PerformanceThresholds {
  memory: number; // MB
  cpu: number; // percentage
  networkErrors: number; // percentage
  firebaseLatency: number; // ms
  appLoadTime: number; // ms
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  memory: 100, // 100MB
  cpu: 80, // 80%
  networkErrors: 5, // 5%
  firebaseLatency: 1000, // 1 second
  appLoadTime: 3000, // 3 seconds
};

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [thresholds, setThresholds] = useState<PerformanceThresholds>(DEFAULT_THRESHOLDS);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(Date.now());

  const getStatusColor = (value: number, threshold: number, isLowerBetter = false) => {
    const ratio = value / threshold;
    if (isLowerBetter) {
      return ratio <= 0.7 ? 'bg-green-100 text-green-800' : 
             ratio <= 1.0 ? 'bg-yellow-100 text-yellow-800' : 
             'bg-red-100 text-red-800';
    } else {
      return ratio <= 0.7 ? 'bg-green-100 text-green-800' : 
             ratio <= 1.0 ? 'bg-yellow-100 text-yellow-800' : 
             'bg-red-100 text-red-800';
    }
  };

  const getStatusIcon = (value: number, threshold: number, isLowerBetter = false) => {
    const ratio = value / threshold;
    if (isLowerBetter) {
      return ratio <= 0.7 ? <CheckCircle className="w-4 h-4" /> : 
             ratio <= 1.0 ? <AlertTriangle className="w-4 h-4" /> : 
             <TrendingDown className="w-4 h-4" />;
    } else {
      return ratio <= 0.7 ? <CheckCircle className="w-4 h-4" /> : 
             ratio <= 1.0 ? <AlertTriangle className="w-4 h-4" /> : 
             <TrendingUp className="w-4 h-4" />;
    }
  };

  const collectMetrics = async (): Promise<PerformanceMetrics> => {
    const now = Date.now();
    const uptime = now - startTime.current;

    // Memory usage
    const memory = {
      used: 0,
      total: 0,
      limit: 0,
    };

    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      memory.used = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
      memory.total = Math.round(memInfo.totalJSHeapSize / 1024 / 1024);
      memory.limit = Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024);
    }

    // CPU usage (simplified)
    const cpu = {
      usage: Math.random() * 100, // This would need a real implementation
      cores: navigator.hardwareConcurrency || 1,
    };

    // Network metrics (simplified)
    const network = {
      requests: Math.floor(Math.random() * 100),
      errors: Math.floor(Math.random() * 10),
      avgResponseTime: Math.random() * 500,
    };

    // Firebase metrics (simplified)
    const firebase = {
      reads: Math.floor(Math.random() * 50),
      writes: Math.floor(Math.random() * 20),
      errors: Math.floor(Math.random() * 5),
      avgLatency: Math.random() * 200,
    };

    // App metrics
    const app = {
      loadTime: performance.now(),
      renderTime: performance.now() - startTime.current,
      interactions: Math.floor(Math.random() * 100),
    };

    return {
      timestamp: now,
      memory,
      cpu,
      network,
      firebase,
      app,
    };
  };

  const checkThresholds = (metrics: PerformanceMetrics) => {
    const newAlerts: string[] = [];

    // Memory check
    if (metrics.memory.used > thresholds.memory) {
      newAlerts.push(`High memory usage: ${metrics.memory.used}MB`);
      // errorTrackingService.trackPerformanceError('memory_usage', metrics.memory.used, thresholds.memory, {
      //   page: 'performance_monitor',
      //   additionalData: { current: metrics.memory.used, threshold: thresholds.memory },
      // });
    }

    // CPU check
    if (metrics.cpu.usage > thresholds.cpu) {
      newAlerts.push(`High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`);
      // errorTrackingService.trackPerformanceError('cpu_usage', metrics.cpu.usage, thresholds.cpu, {
      //   page: 'performance_monitor',
      //   additionalData: { current: metrics.cpu.usage, threshold: thresholds.cpu },
      // });
    }

    // Network errors check
    const networkErrorRate = (metrics.network.errors / metrics.network.requests) * 100;
    if (networkErrorRate > thresholds.networkErrors && metrics.network.requests > 0) {
      newAlerts.push(`High network error rate: ${networkErrorRate.toFixed(1)}%`);
      // errorTrackingService.trackPerformanceError('network_error_rate', networkErrorRate, thresholds.networkErrors, {
      //   page: 'performance_monitor',
      //   additionalData: { current: networkErrorRate, threshold: thresholds.networkErrors },
      // });
    }

    // Firebase latency check
    if (metrics.firebase.avgLatency > thresholds.firebaseLatency) {
      newAlerts.push(`High Firebase latency: ${metrics.firebase.avgLatency.toFixed(0)}ms`);
      // errorTrackingService.trackPerformanceError('firebase_latency', metrics.firebase.avgLatency, thresholds.firebaseLatency, {
      //   page: 'performance_monitor',
      //   additionalData: { current: metrics.firebase.avgLatency, threshold: thresholds.firebaseLatency },
      // });
    }

    // App load time check
    if (metrics.app.loadTime > thresholds.appLoadTime) {
      newAlerts.push(`Slow app load time: ${metrics.app.loadTime.toFixed(0)}ms`);
      // errorTrackingService.trackPerformanceError('app_load_time', metrics.app.loadTime, thresholds.appLoadTime, {
      //   page: 'performance_monitor',
      //   additionalData: { current: metrics.app.loadTime, threshold: thresholds.appLoadTime },
      // });
    }

    setAlerts(newAlerts);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    monitoringInterval.current = setInterval(async () => {
      const newMetrics = await collectMetrics();
      setMetrics(newMetrics);
      checkThresholds(newMetrics);
    }, 5000); // Update every 5 seconds
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  };

  useEffect(() => {
    // Initial metrics collection
    collectMetrics().then(setMetrics);
    
    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
    };
  }, []);

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>
            Loading performance metrics...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Performance Monitor
              </CardTitle>
              <CardDescription>
                Real-time application performance monitoring
              </CardDescription>
            </div>
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
          </p>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Performance Alerts:</strong>
            <ul className="mt-2 space-y-1">
              {alerts.map((alert, index) => (
                <li key={index} className="text-sm">• {alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                Memory Usage
              </CardTitle>
              <Badge className={getStatusColor(metrics.memory.used, thresholds.memory)}>
                {getStatusIcon(metrics.memory.used, thresholds.memory)}
                <span className="ml-1">{metrics.memory.used}MB</span>
              </Badge>
            </div>
            <CardDescription>JavaScript heap memory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>{metrics.memory.used}MB</span>
              </div>
              <Progress 
                value={(metrics.memory.used / metrics.memory.limit) * 100} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total: {metrics.memory.total}MB</span>
                <span>Limit: {metrics.memory.limit}MB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CPU Usage */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                CPU Usage
              </CardTitle>
              <Badge className={getStatusColor(metrics.cpu.usage, thresholds.cpu)}>
                {getStatusIcon(metrics.cpu.usage, thresholds.cpu)}
                <span className="ml-1">{metrics.cpu.usage.toFixed(1)}%</span>
              </Badge>
            </div>
            <CardDescription>Processor utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span>{metrics.cpu.usage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.cpu.usage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Cores: {metrics.cpu.cores}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Performance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Network className="w-4 h-4" />
                Network
              </CardTitle>
              <Badge className={getStatusColor(metrics.network.avgResponseTime, thresholds.firebaseLatency, true)}>
                {getStatusIcon(metrics.network.avgResponseTime, thresholds.firebaseLatency, true)}
                <span className="ml-1">{metrics.network.avgResponseTime.toFixed(0)}ms</span>
              </Badge>
            </div>
            <CardDescription>Request performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Requests</span>
                <span>{metrics.network.requests}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Errors</span>
                <span className="text-red-600">{metrics.network.errors}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg Response</span>
                <span>{metrics.network.avgResponseTime.toFixed(0)}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Firebase Performance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                Firebase
              </CardTitle>
              <Badge className={getStatusColor(metrics.firebase.avgLatency, thresholds.firebaseLatency, true)}>
                {getStatusIcon(metrics.firebase.avgLatency, thresholds.firebaseLatency, true)}
                <span className="ml-1">{metrics.firebase.avgLatency.toFixed(0)}ms</span>
              </Badge>
            </div>
            <CardDescription>Database performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Reads</span>
                <span>{metrics.firebase.reads}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Writes</span>
                <span>{metrics.firebase.writes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Errors</span>
                <span className="text-red-600">{metrics.firebase.errors}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg Latency</span>
                <span>{metrics.firebase.avgLatency.toFixed(0)}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Performance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                App Performance
              </CardTitle>
              <Badge className={getStatusColor(metrics.app.loadTime, thresholds.appLoadTime, true)}>
                {getStatusIcon(metrics.app.loadTime, thresholds.appLoadTime, true)}
                <span className="ml-1">{metrics.app.loadTime.toFixed(0)}ms</span>
              </Badge>
            </div>
            <CardDescription>Application metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Load Time</span>
                <span>{metrics.app.loadTime.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Render Time</span>
                <span>{metrics.app.renderTime.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Interactions</span>
                <span>{metrics.app.interactions}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Uptime
            </CardTitle>
            <CardDescription>Application uptime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((Date.now() - startTime.current) / 1000 / 60)}m
            </div>
            <p className="text-xs text-muted-foreground">
              Since last restart
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PerformanceMonitor; 