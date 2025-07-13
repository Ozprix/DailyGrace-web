
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useJournal } from '@/hooks/use-journal';
import { useFavorites } from '@/hooks/use-favorites';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useContent } from '@/contexts/content-context';
import type { ExclusiveDevotionalSeries } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Bookmark, Heart, Gift, ChevronRight, Loader2, LayoutGrid } from 'lucide-react';
import Header from '@/components/ui/header';
import { iconMap } from '@/lib/nav-links';

const SummaryCard = ({ icon, title, count, link, linkText, isLoading }: { icon: React.ElementType, title: string, count: number, link: string, linkText: string, isLoading: boolean }) => (
    <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
                {React.createElement(icon, { className: "h-5 w-5 text-primary" })}
                {title}
            </CardTitle>
            {isLoading ? <Skeleton className="h-6 w-12" /> : <div className="text-2xl font-bold">{count}</div>}
        </CardHeader>
        <CardContent>
            <Button asChild variant="link" className="p-0 text-sm">
                <Link href={link}>{linkText} <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
        </CardContent>
    </Card>
);

const ExclusiveSeriesCard = ({ series }: { series: ExclusiveDevotionalSeries }) => {
    const IconComponent = iconMap[series.iconName] || Gift;
    return (
        <Link href={`/my-content/exclusive-series/${series.id}`}>
            <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <IconComponent className="h-6 w-6 text-accent" />
                        <CardTitle className="text-lg">{series.name}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{series.description}</p>
                </CardContent>
            </Card>
        </Link>
    );
};

export default function MyContentPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { loadAllJournalEntries, isLoadingJournal } = useJournal();
    const { favorites, isLoaded: favoritesLoaded } = useFavorites();
    const { preferences, isLoaded: prefsLoaded } = useUserPreferences();
    const { getAllExclusiveSeries, isLoadingContent } = useContent();
    
    const [journalCount, setJournalCount] = useState(0);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchJournalCount = async () => {
            if (user) {
                const entries = await loadAllJournalEntries();
                setJournalCount(entries.length);
            }
        };
        fetchJournalCount();
    }, [user, loadAllJournalEntries]);

    const unlockedSeries = getAllExclusiveSeries().filter(series => 
        preferences.unlockedExclusiveSeriesIds?.includes(series.id)
    );

    const isLoading = authLoading || isLoadingJournal || !favoritesLoaded || !prefsLoaded || isLoadingContent;

    return (
        <div className="min-h-screen flex flex-col items-center text-foreground">
            <Header title="My Content" />
            <main className="container mx-auto py-8 max-w-4xl flex-grow">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold text-primary">My Content Hub</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <SummaryCard 
                        icon={Bookmark}
                        title="Journal Entries"
                        count={journalCount}
                        link="/journal"
                        linkText="View all entries"
                        isLoading={isLoadingJournal}
                    />
                    <SummaryCard 
                        icon={Heart}
                        title="Favorited Verses"
                        count={favorites.length}
                        link="/favorites"
                        linkText="View all favorites"
                        isLoading={!favoritesLoaded}
                    />
                </div>
                
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-accent flex items-center gap-2">
                       <Gift className="h-6 w-6" /> Unlocked Exclusive Series
                    </h2>
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-36 w-full" />
                            <Skeleton className="h-36 w-full" />
                        </div>
                    ) : unlockedSeries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {unlockedSeries.map(series => (
                                <ExclusiveSeriesCard key={series.id} series={series} />
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center p-8 bg-muted/50">
                            <CardTitle>No Unlocked Series Yet</CardTitle>
                            <CardDescription className="mt-2">Visit the Grace Store to unlock exclusive devotional series with your points.</CardDescription>
                            <Button asChild className="mt-4">
                                <Link href="/store">Go to Store</Link>
                            </Button>
                        </Card>
                    )}
                </div>
            </main>
             <footer className="w-full text-center py-6 px-4 border-t border-border/60">
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace.</p>
            </footer>
        </div>
    );
}
