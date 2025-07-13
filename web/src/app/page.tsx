// src/app/page.tsx
"use client";

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, BookOpen, HelpingHand, MessageCircle, Flame, Award, Trophy, PenSquare, Puzzle, AlertCircle, RefreshCcw, CheckCircle, Circle, Loader2, Star } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useStreaks } from '@/hooks/use-streaks';
import { useContent } from '@/contexts/content-context';
import { useUserChallenges } from '@/hooks/use-user-challenges';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { useMissions } from '@/hooks/use-missions';
import { getCurrentTheme } from '@/lib/themes';

const StatCard = ({ icon: Icon, label, value, isLoading }: { icon: React.ElementType, label: string, value: number | string, isLoading?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);

const DiscoverCard = ({ href, icon: Icon, title, description }: { href: string, icon: React.ElementType, title: string, description: string }) => (
    <Link href={href} className="block h-full">
        <Card className="h-full hover:bg-muted/50 transition-colors">
            <CardHeader>
                <div className="bg-primary/10 text-primary p-3 rounded-full w-fit mb-2">
                    <Icon className="h-6 w-6" />
                </div>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    </Link>
);


export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const { preferences, isLoaded: preferencesLoaded } = useUserPreferences();
    const { streakData, isLoading: isLoadingStreaks } = useStreaks();
    const { getVerseById, isLoadingContent: isLoadingContentContext } = useContent();
    const { activeChallenges, isLoading: isLoadingChallenges } = useUserChallenges();
    const { weeklyMissions, isLoadingMissions, handleCompleteMission, isCompletingMission } = useMissions();
    const router = useRouter();
    
    const weeklyTheme = getCurrentTheme();
    const ThemeIcon = weeklyTheme.icon;
    
    const verseOfTheDay = useMemo(() => {
        if (preferences?.verseOfTheDayId && !isLoadingContentContext) {
            return getVerseById(preferences.verseOfTheDayId);
        }
        return null;
    }, [preferences?.verseOfTheDayId, getVerseById, isLoadingContentContext]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };
    
    useEffect(() => {
        if (analytics) {
          logEvent(analytics, 'view_page', { page_name: 'dashboard' });
        }
    }, []);

    if (authLoading || !preferencesLoaded || isLoadingContentContext || isLoadingChallenges) {
        return (
             <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-9 w-48" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-24 w-full"/>
                    <Skeleton className="h-24 w-full"/>
                    <Skeleton className="h-24 w-full lg:col-span-1"/>
                </div>
                <Skeleton className="h-48 w-full" />
                 <div>
                    <Skeleton className="h-8 w-64 mb-4" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        );
    }
    
    const recentChallenge = activeChallenges.length > 0 ? activeChallenges[0] : null;

    return (
        <>
            {user && <OnboardingTour />}
            <div className="flex flex-col gap-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div >
                        <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}, {user?.displayName || 'Friend'}!</h1>
                        <p className="text-muted-foreground">Let's start the day with grace.</p>
                    </div>
                </div>

                {/* Stats and Theme Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stat Cards on the left for large screens */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                        <StatCard icon={Flame} label="Day Streak" value={streakData?.currentStreak || 0} isLoading={isLoadingStreaks} />
                        <StatCard icon={Award} label="Grace Points" value={preferences?.totalPoints || 0} isLoading={!preferencesLoaded} />
                    </div>
                    {/* Theme Card on the right for large screens */}
                    <Card className="col-span-1 lg:col-span-1 bg-primary/10 border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <ThemeIcon className="h-5 w-5 text-primary" />
                          This Week's Theme
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-semibold">{weeklyTheme.name}</p>
                        <p className="text-sm text-muted-foreground">{weeklyTheme.description}</p>
                      </CardContent>
                    </Card>
                </div>


                {/* Daily Focus */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5"/> Verse of the Day</CardTitle>
                        {verseOfTheDay ? <CardDescription>{verseOfTheDay.reference}</CardDescription> : <Skeleton className="h-5 w-24 mt-1" />}
                    </CardHeader>
                    <CardContent>
                            {verseOfTheDay ? (
                            <p className="italic">"{verseOfTheDay.text}"</p>
                            ) : (
                            isLoadingContentContext ? <Skeleton className="h-12 w-full" /> : <p className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Could not load verse.</p>
                            )}
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="link" className="p-0">
                            <Link href="/daily-devotional">Read Full Devotional <ArrowRight className="ml-1 h-4 w-4"/></Link>
                        </Button>
                    </CardFooter>
                </Card>

                {/* Weekly Missions Section */}
                <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-4">This Week's Missions</h2>
                    <Card>
                        <CardContent className="p-4 sm:p-6">
                            {isLoadingMissions ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : weeklyMissions && weeklyMissions.length > 0 ? (
                                <div className="space-y-4">
                                    {weeklyMissions.map(({ missionId, completed, details }) => (
                                        <div key={missionId} className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-grow">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => !completed && handleCompleteMission(missionId)} 
                                                    disabled={completed || !!isCompletingMission}
                                                    aria-label={completed ? `Mission ${details?.title} completed` : `Complete mission ${details?.title}`}
                                                    className="rounded-full"
                                                >
                                                    {isCompletingMission === missionId ? 
                                                        <Loader2 className="h-5 w-5 animate-spin" /> : 
                                                        completed ? 
                                                            <CheckCircle className="h-5 w-5 text-green-500" /> : 
                                                            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                                                    }
                                                </Button>
                                                <div className="flex-grow">
                                                    <p className={`font-medium ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                        {details?.title}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{details?.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-accent border-accent/50">{details?.points} pts</Badge>
                                                {details?.link && (
                                                    <Button asChild variant="secondary" size="sm">
                                                        <Link href={details.link}>{details.actionText || 'Go'}</Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">Your new weekly missions will appear here soon!</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Continue Section */}
                {recentChallenge && (
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight mb-4">Continue Where You Left Off</h2>
                        <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
                            <Link href={`/challenges/${recentChallenge.challengeId}`}>
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className='w-2/3'>
                                        <Badge variant="secondary" className="mb-2">Active Challenge</Badge>
                                        <h3 className="font-semibold text-lg">{recentChallenge.challengeName}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">You are on Day {recentChallenge.currentDay} of {recentChallenge.totalDays}. Keep going!</p>
                                    </div>
                                    <ArrowRight className="h-6 w-6 text-muted-foreground"/>
                                </CardContent>
                            </Link>
                        </Card>
                    </div>
                )}
                
                {/* Discover Section */}
                <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-4">Discover More</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DiscoverCard 
                            href="/challenges"
                            icon={Trophy}
                            title="Spiritual Challenges"
                            description="Embark on guided journeys of faith, growth, and reflection."
                        />
                        <DiscoverCard 
                            href="/generate-devotional"
                            icon={PenSquare}
                            title="Custom Devotional"
                            description="Generate a unique devotional for any Bible verse you choose."
                        />
                         <DiscoverCard 
                            href="/prayer-wall"
                            icon={HelpingHand}
                            title="Prayer Wall"
                            description="Share anonymous prayers and support the community."
                        />
                         <DiscoverCard 
                            href="/prayer-circles"
                            icon={MessageCircle}
                            title="Prayer Circles"
                            description="Join or create private groups to share prayer requests."
                        />
                        <DiscoverCard 
                            href="/reading-plans"
                            icon={BookOpen}
                            title="Reading Plans"
                            description="Follow structured plans to journey through Scripture."
                        />
                        <DiscoverCard 
                            href="/quiz"
                            icon={Puzzle}
                            title="Test Your Knowledge"
                            description="Engage with fun quizzes about the Bible and faith."
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
