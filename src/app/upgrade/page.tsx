
// src/app/upgrade/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { ShieldCheck, Sparkles, Heart, XCircle, ArrowLeft, Loader2, BookOpen, MessageSquareMore, CalendarCheck2, Star } from 'lucide-react';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession } from '@/app/actions/stripeActions';

const PREMIUM_PRICE_ID_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID_MONTHLY;

export default function UpgradePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

   useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'upgrade_page' });
    }
  }, []);

  const handleUpgradeClick = async () => {
    setIsLoading(true);
    if (analytics) {
      logEvent(analytics, 'upgrade_button_tapped_on_upgrade_page', {
        user_id: user?.uid || 'anonymous',
        price_id: PREMIUM_PRICE_ID_MONTHLY,
      });
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        toast({
            title: "Configuration Error",
            description: "Stripe is not configured for this application. Publishable key missing.",
            variant: "destructive",
        });
        console.error("Stripe Error: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.");
        setIsLoading(false);
        return;
    }
    
    if (!PREMIUM_PRICE_ID_MONTHLY || !PREMIUM_PRICE_ID_MONTHLY.startsWith('price_')) {
       toast({
            title: "Configuration Error",
            description: "Stripe Price ID (monthly) is not configured correctly.",
            variant: "destructive",
        });
        console.error("Stripe Error: NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID_MONTHLY is invalid:", PREMIUM_PRICE_ID_MONTHLY);
        setIsLoading(false);
        return;
    }

    if (!user) {
        toast({
            title: "Authentication Required",
            description: "You must be logged in to upgrade your account.",
            variant: "destructive",
        });
        setIsLoading(false);
        router.push('/login');
        return;
    }


    try {
      const { checkoutUrl, error: sessionError } = await createCheckoutSession({
        priceId: PREMIUM_PRICE_ID_MONTHLY,
        userId: user.uid,
      });

      if (sessionError || !checkoutUrl) {
        console.error("Error creating Stripe checkout session:", sessionError);
        toast({
          title: "Upgrade Error",
          description: sessionError || "Could not initiate the upgrade process. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        if (analytics) {
            logEvent(analytics, 'create_checkout_session_failed', { 
                price_id: PREMIUM_PRICE_ID_MONTHLY, 
                error: sessionError || "No checkout URL returned"
            });
        }
        return;
      }
      
      // Open the checkout URL in a new tab
      window.open(checkoutUrl, '_blank');
      

    } catch (error: any) {
      console.error("Generic error during upgrade process:", error);
      toast({
        title: "Upgrade Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
       if (analytics) {
            logEvent(analytics, 'upgrade_process_generic_error', { 
                price_id: PREMIUM_PRICE_ID_MONTHLY,
                error_message: error.message 
            });
        }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: CalendarCheck2, text: "Unlimited access to all Spiritual Challenges." },
    { icon: MessageSquareMore, text: "Detailed AI-powered reflections and prayer points." },
    { icon: Heart, text: "Unlimited favorites for verses and devotionals." },
    { icon: Star, text: "Exclusive Premium content & features (coming soon)." },
    { icon: XCircle, text: "Ad-free experience (coming soon)." },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-muted text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Go Premium</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-lg shadow-xl bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center items-center">
            <Sparkles className="h-12 w-12 text-accent mb-3" />
            <CardTitle className="text-3xl font-bold text-primary">Unlock Your Full Potential</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-1">
              Experience Daily Grace without limits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-8">
            <ul className="space-y-3 text-foreground/90">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <feature.icon className="h-6 w-6 text-green-500 mt-0.5 shrink-0" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                    You will be redirected to Stripe to complete your purchase securely.
                </p>
                <p className="text-2xl font-semibold text-primary mt-1">
                   Monthly Plan
                </p>
                 <p className="text-xs text-muted-foreground">
                    (Price ID: {PREMIUM_PRICE_ID_MONTHLY})
                </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-8">
            <Button
              size="lg"
              className="w-full text-base py-6"
              variant="primaryGradient"
              onClick={handleUpgradeClick}
              disabled={isLoading || !PREMIUM_PRICE_ID_MONTHLY}
              title={!PREMIUM_PRICE_ID_MONTHLY ? "Stripe Price ID not configured" : "Upgrade to Premium"}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
              {isLoading ? 'Processing...' : 'Upgrade to Premium'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Maybe Later
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
