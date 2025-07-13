// src/app/upgrade/canceled/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function UpgradeCanceledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted text-foreground selection:bg-primary/20 selection:text-primary">
      <Card className="w-full max-w-sm shadow-xl bg-card/90 backdrop-blur-sm border-border/50 text-center">
        <CardHeader className="items-center">
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <CardTitle className="text-2xl font-bold text-primary">Upgrade Canceled</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Your Stripe checkout session was canceled.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>You can try again or return to the previous page.</p>
          <Button onClick={() => router.push('/upgrade')} className="w-full">
            Try Again
          </Button>
           <Button variant="ghost" onClick={() => router.back()} className="w-full text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
