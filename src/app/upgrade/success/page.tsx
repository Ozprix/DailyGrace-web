// src/app/upgrade/success/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Home } from 'lucide-react';

export default function UpgradeSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted text-foreground selection:bg-primary/20 selection:text-primary">
      <Card className="w-full max-w-sm shadow-xl bg-card/90 backdrop-blur-sm border-border/50 text-center">
        <CardHeader className="items-center">
          <ShieldCheck className="h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-2xl font-bold text-primary">Upgrade Successful!</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Welcome to Daily Grace Premium.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>Your premium access is now active. Enjoy all the exclusive features!</p>
          <Button onClick={() => router.push('/')} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
