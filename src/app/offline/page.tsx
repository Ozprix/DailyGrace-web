
// src/app/offline/page.tsx
"use client";

import { WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useEffect } from 'react';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';

export default function OfflinePage() {

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'offline_fallback_page' });
    }
  }, []);

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      if (analytics) {
        logEvent(analytics, 'offline_page_retry_clicked');
      }
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 selection:bg-primary/20 selection:text-primary">
      <main className="flex flex-col items-center text-center">
        <Card className="w-full max-w-md shadow-xl bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="items-center">
                <div className="p-3 bg-destructive/10 rounded-full mb-4">
                    <WifiOff className="h-12 w-12 text-destructive" />
                </div>
                <CardTitle className="text-2xl font-bold text-destructive">You're Offline</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                    It seems you've lost your internet connection.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-foreground/80">
                    Please check your network settings and try again. Some previously visited pages might still be accessible.
                </p>
                <div className="flex flex-col items-center space-y-3">
                     <p className="text-lg font-semibold text-primary opacity-70">Daily Grace</p>
                </div>
            </CardContent>
            <CardFooter className="flex-col space-y-3">
                 <Button onClick={handleRetry} variant="primaryGradient" className="w-full">
                    Retry Connection
                </Button>
                <Button onClick={() => {
                    if (typeof window !== 'undefined') {
                         if (analytics) {
                            logEvent(analytics, 'offline_page_go_home_clicked');
                        }
                        window.location.href = '/';
                    }
                }} variant="outline" className="w-full">
                    Go to Homepage (if cached)
                </Button>
            </CardFooter>
        </Card>

        <AlertTriangle className="h-16 w-16 text-amber-500 opacity-30 fixed bottom-6 right-6 -z-10" />
      </main>
    </div>
  );
}
