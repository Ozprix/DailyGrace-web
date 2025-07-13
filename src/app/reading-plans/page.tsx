// src/app/reading-plans/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import type { ReadingPlan } from '@/types/reading-plan';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowLeft, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import UserDropdownMenu from '@/components/user-dropdown-menu';
import { getCurrentTheme } from '@/lib/themes';
import { useReadingPlans } from '@/hooks/use-reading-plans'; // Import the new hook

const PlanCardSkeleton = () => (
  <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-border/50 flex flex-col justify-between">
    <CardHeader>
      <Skeleton className="h-7 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6" />
    </CardHeader>
    <CardContent className="flex-grow">
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-2 w-full" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-5 w-1/4" />
    </CardFooter>
  </Card>
);
 
const ReadingPlansPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { allReadingPlans, userProgressMap, isLoading } = useReadingPlans(); // Use the new hook
  const [error, setError] = useState<string | null>(null); // Keep local error state for UI
  const router = useRouter();

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'reading_plans_overview_page' });
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const weeklyTheme = useMemo(() => getCurrentTheme(), []);

  const featuredPlans = useMemo(() => {
    return allReadingPlans.filter(plan => {
      const planText = `${plan.name} ${plan.description}`.toLowerCase();
      return weeklyTheme.keywords.some(keyword => planText.includes(keyword));
    });
  }, [allReadingPlans, weeklyTheme]);

  const regularPlans = useMemo(() => {
    const featuredIds = new Set(featuredPlans.map(p => p.id));
    return allReadingPlans.filter(plan => !featuredIds.has(plan.id));
  }, [allReadingPlans, featuredPlans]);

  const navigateTo = (path: string, pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: 'reading_plans_page_interaction' });
    }
    router.push(path);
  };

  const PlanGrid = ({ plans }: { plans: ReadingPlan[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const planProgress = userProgressMap.get(plan.id);
        const completedCount = planProgress?.completedDays?.length || 0;
        const totalCount = Array.isArray(plan.readings) ? plan.readings.length : 0;
        const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        return (
          <Link href={`/reading-plans/${plan.id}`} key={plan.id} className="block group transition-transform duration-300 hover:-translate-y-1">
            <Card className={`h-full flex flex-col transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50 ${planProgress?.status === 'completed' ? 'border-green-500 bg-green-500/5 dark:bg-green-500/10' : 'border-border bg-card/80 backdrop-blur-sm'}`}>
              <CardHeader>
                <CardTitle className="text-xl text-primary group-hover:text-accent">{plan.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-3">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {user && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{completedCount} of {totalCount} readings</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                     {planProgress?.status === 'active' && (
                      <Badge variant="secondary" className="mt-2 text-xs">In Progress</Badge>
                    )}
                    {planProgress?.status === 'completed' && (
                      <Badge variant="default" className="mt-2 text-xs bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:text-black">
                        <CheckCircle className="mr-1 h-3 w-3"/>Completed
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                 <p className="text-xs text-muted-foreground">
                  {totalCount} {totalCount === 1 ? 'reading' : 'readings'}
                </p>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
        <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigateTo('/', 'home_via_back_arrow')} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div><h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Reading Plans</h1></div>
            </div>
             <div className="flex items-center gap-2"> <ThemeToggle /> <Skeleton className="h-10 w-10 rounded-full" /></div>
        </header>
        <main className="flex-grow w-full container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading reading plans...</p>
        </main>
      </div>
    );
  }
  
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigateTo('/', 'home_via_back_arrow')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Reading Plans</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Grow in your understanding of God's Word.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserDropdownMenu />
        </div>
      </header>

      <main className="flex-grow container mx-auto py-8 px-4 md:px-6 w-full animate-fade-in space-y-12">
        {error && <p className="text-destructive text-center mb-6">Error: {error}</p>}
        {allReadingPlans.length === 0 && !isLoading && !error && (
          <div className="text-center py-10">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4"/>
            <h2 className="text-2xl font-semibold text-primary mb-2">No Reading Plans Available</h2>
            <p className="text-muted-foreground">Check back soon for new plans to help you grow in faith!</p>
            <p className="text-xs text-muted-foreground mt-2">(Ensure reading plans are seeded in Firestore if this is unexpected)</p>
          </div>
        )}

        {featuredPlans.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold tracking-tight mb-4 flex items-center gap-2">
              <weeklyTheme.icon className="h-6 w-6 text-accent" />
              Featured for '{weeklyTheme.name}' Week
            </h2>
            <PlanGrid plans={featuredPlans} />
          </section>
        )}

        {regularPlans.length > 0 && (
           <section>
             <h2 className="text-2xl font-semibold tracking-tight mb-4">
              {featuredPlans.length > 0 ? 'All Other Plans' : 'All Reading Plans'}
            </h2>
            <PlanGrid plans={regularPlans} />
          </section>
        )}
      </main>
      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Daily Grace. Journey through Scripture.
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="text-xs text-muted-foreground">|</span>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default ReadingPlansPage;
