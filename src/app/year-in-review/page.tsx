
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useJournal } from '@/hooks/use-journal';
import { useFavorites } from '@/hooks/use-favorites';
import { useUserChallenges } from '@/hooks/use-user-challenges';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Bookmark, Trophy, Heart, Award, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import Header from '@/components/ui/header';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Timestamp } from 'firebase/firestore';

interface StatData {
  journalEntries: number;
  challengesCompleted: number;
  versesFavorited: number;
  gracePoints: number;
}

const StatCard = ({ icon: Icon, title, value, isLoading, description }: { icon: React.ElementType, title: string, value: number, isLoading: boolean, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2"/> : <div className="text-4xl font-bold text-primary">{value}</div>}
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const StatCardSkeleton = () => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </CardContent>
    </Card>
);

export default function ProgressDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { preferences, isLoaded: prefsLoaded } = useUserPreferences();
  const { loadAllJournalEntries, isLoadingJournal } = useJournal();
  const { favorites, isLoaded: favoritesLoaded } = useFavorites();
  const { challengeProgressCache, isLoading: isLoadingUserChallenges } = useUserChallenges();

  const [statData, setStatData] = useState<StatData | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const pageIsLoading = authLoading || !prefsLoaded || !favoritesLoaded || isLoadingUserChallenges || isLoadingJournal;

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'progress_dashboard_page' });
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const processData = async () => {
      if (pageIsLoading || !user) return;

      const journalEntries = await loadAllJournalEntries();
      const completedChallenges = Array.from(challengeProgressCache.values()).filter(
        progress => progress?.status === 'completed'
      );

      setStatData({
        journalEntries: journalEntries.length,
        challengesCompleted: completedChallenges.length,
        versesFavorited: favorites.length,
        gracePoints: preferences.totalPoints || 0,
      });

      // Process data for chart
      const today = new Date();
      const newChartData = Array.from({ length: 6 }).map((_, i) => {
          const d = subMonths(today, 5 - i); // Go from 5 months ago to today
          return {
              name: format(d, 'MMM'),
              journals: 0,
              challenges: 0,
          };
      });

      journalEntries.forEach(entry => {
        const entryDate = entry.lastSaved instanceof Timestamp ? entry.lastSaved.toDate() : new Date(entry.lastSaved);
        if (entryDate >= startOfMonth(subMonths(today, 5))) {
          const monthName = format(entryDate, 'MMM');
          const monthData = newChartData.find(d => d.name === monthName);
          if (monthData) {
              monthData.journals++;
          }
        }
      });
      
      completedChallenges.forEach(progress => {
        if (progress?.lastDayCompletedAt) {
            const completionDate = progress.lastDayCompletedAt.toDate();
            if (completionDate >= startOfMonth(subMonths(today, 5))) {
                const monthName = format(completionDate, 'MMM');
                const monthData = newChartData.find(d => d.name === monthName);
                if (monthData) {
                    monthData.challenges++;
                }
            }
        }
      });

      setChartData(newChartData);

      if (analytics) {
        logEvent(analytics, 'view_progress_dashboard_data', {
            journal_entries: journalEntries.length,
            challenges_completed: completedChallenges.length,
            verses_favorited: favorites.length,
            grace_points: preferences.totalPoints || 0
        });
      }
    };

    processData();
  }, [user, pageIsLoading, loadAllJournalEntries, challengeProgressCache, favorites.length, preferences.totalPoints]);


  return (
    <div className="min-h-screen flex flex-col items-center text-foreground selection:bg-primary/20 selection:text-primary">
       <Header title="Progress Dashboard" />
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
          <div className="flex items-center mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold ml-4 text-primary">Your Progress Dashboard</h1>
          </div>

          <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
              {pageIsLoading || !statData ? (
                  <>
                    <StatCardSkeleton/>
                    <StatCardSkeleton/>
                    <StatCardSkeleton/>
                    <StatCardSkeleton/>
                  </>
              ) : (
                  <>
                    <StatCard icon={Bookmark} title="Journal Entries" value={statData.journalEntries} isLoading={pageIsLoading} description="Total reflections written."/>
                    <StatCard icon={Trophy} title="Challenges Completed" value={statData.challengesCompleted} isLoading={pageIsLoading} description="Total guided journeys finished."/>
                    <StatCard icon={Heart} title="Verses Favorited" value={statData.versesFavorited} isLoading={pageIsLoading} description="Total verses you've loved."/>
                    <StatCard icon={Award} title="Grace Points" value={statData.gracePoints} isLoading={pageIsLoading} description="Your current points balance."/>
                  </>
              )}
          </div>
          
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5"/> Monthly Activity</CardTitle>
                  <CardDescription>Your activity over the last 6 months.</CardDescription>
              </CardHeader>
              <CardContent>
                {pageIsLoading ? (
                    <div className="w-full h-[300px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin"/>
                    </div>
                ) : (
                  <div className="w-full h-[300px]">
                      <ChartContainer config={{
                          journals: { label: "Journals", color: "hsl(var(--primary))" },
                          challenges: { label: "Challenges", color: "hsl(var(--accent))" },
                      }}>
                        <BarChart data={chartData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Legend />
                            <Bar dataKey="journals" fill="var(--color-journals)" radius={4} />
                            <Bar dataKey="challenges" fill="var(--color-challenges)" radius={4} />
                        </BarChart>
                      </ChartContainer>
                  </div>
                )}
              </CardContent>
          </Card>
      </main>
       <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace.</p>
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
}
