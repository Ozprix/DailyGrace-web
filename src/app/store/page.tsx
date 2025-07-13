
// src/app/store/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useContent } from '@/contexts/content-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import type { ExclusiveDevotionalSeries, ThemeStoreItem, SymbolicGiftStoreItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Sparkles, Gift, ShoppingBag, Award, Terminal, Loader2, CheckCircle, Eye, Palette, Flame, HeartHandshake, Filter, Lock } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { Badge } from '@/components/ui/badge';
import UserDropdownMenu from '@/components/user-dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { iconMap, type IconName } from '@/lib/nav-links';


type ItemType = 'all' | 'series' | 'themes' | 'gifts';
type SortType = 'cost-asc' | 'cost-desc' | 'name-asc';

const StoreItemSkeleton = () => (
  <Card className="shadow-lg">
    <CardHeader>
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-7 w-3/4" />
      </div>
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-4 w-5/6 mb-3" />
      <Skeleton className="h-5 w-1/3" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);

export default function GraceStorePage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    getAllExclusiveSeries, 
    getAllThemeItems, 
    getAllSymbolicGifts, 
    isLoadingContent, 
    contentError 
  } = useContent();
  const { 
    preferences, 
    unlockExclusiveSeries, 
    unlockTheme, 
    purchaseSymbolicGift,
    setActiveCustomTheme, 
    isLoaded: preferencesLoaded, 
    isSaving, 
    savingPreferenceType 
  } = useUserPreferences();
  const router = useRouter();
  const { toast } = useToast();

  const [isUnlockingId, setIsUnlockingId] = useState<string | null>(null);
  const [isApplyingThemeId, setIsApplyingThemeId] = useState<string | null>(null);
  const [isPurchasingGiftId, setIsPurchasingGiftId] = useState<string | null>(null);
  
  const [filter, setFilter] = useState<ItemType>('all');
  const [sortBy, setSortBy] = useState<SortType>('cost-asc');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);


  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'grace_store_page' });
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleUnlockSeries = async (series: ExclusiveDevotionalSeries) => {
    if (!user || !preferencesLoaded) return;
    if ((preferences.totalPoints || 0) < series.cost) {
      toast({ title: "Not Enough Points", description: `You need ${series.cost} points to unlock "${series.name}". You have ${preferences.totalPoints || 0}.`, variant: "default" });
      return;
    }
    setIsUnlockingId(series.id);
    const success = await unlockExclusiveSeries(series.id, series.cost);
    if (success) {
      toast({ title: "Successfully Unlocked!", description: `You've unlocked "${series.name}".` });
      if (analytics) { logEvent(analytics, 'item_unlocked_from_store', { item_id: series.id, item_name: series.name, item_type: 'exclusive_devotional_series', point_cost: series.cost }); }
    } else {
      toast({ title: "Unlock Failed", description: `Could not unlock "${series.name}". You might not have enough points or an error occurred.`, variant: "destructive" });
    }
    setIsUnlockingId(null);
  };
  
  const handleViewSeriesContent = (seriesId: string, seriesName: string) => {
    if (analytics) { logEvent(analytics, 'view_unlocked_content_clicked', { item_id: seriesId, item_name: seriesName, item_type: 'exclusive_devotional_series' }); }
    router.push(`/my-content/exclusive-series/${seriesId}`);
  };

  const handleUnlockTheme = async (theme: ThemeStoreItem) => {
    if (!user || !preferencesLoaded) return;
    if ((preferences.totalPoints || 0) < theme.cost) {
      toast({ title: "Not Enough Points", description: `You need ${theme.cost} points to unlock "${theme.name}". You have ${preferences.totalPoints || 0}.`, variant: "default" });
      return;
    }
    setIsUnlockingId(theme.id);
    const success = await unlockTheme(theme.id, theme.cost);
    if (success) {
      toast({ title: "Theme Unlocked!", description: `You've unlocked the "${theme.name}" theme.` });
      if (analytics) { logEvent(analytics, 'item_unlocked_from_store', { item_id: theme.id, item_name: theme.name, item_type: 'theme', point_cost: theme.cost }); }
    } else {
      toast({ title: "Unlock Failed", description: `Could not unlock "${theme.name}".`, variant: "destructive" });
    }
    setIsUnlockingId(null);
  };

  const handleApplyTheme = async (themeId: string | null) => {
    setIsApplyingThemeId(themeId);
    const themeToApply = getAllThemeItems().find(t => t.id === themeId);
    await setActiveCustomTheme(themeId);
    toast({ title: themeId ? "Theme Applied!" : "Base Theme Restored", description: themeId ? `The ${themeToApply?.name || 'custom'} theme is now active.` : "Switched back to your base theme preference." });
    setIsApplyingThemeId(null);
    if (analytics) { logEvent(analytics, 'custom_theme_applied_from_store', { theme_id: themeId }); }
  };

  const handlePurchaseSymbolicGift = async (item: SymbolicGiftStoreItem) => {
    if (!user || !preferencesLoaded) return;
    if ((preferences.totalPoints || 0) < item.cost) {
      toast({ title: "Not Enough Points", description: `You need ${item.cost} points for "${item.name}". You have ${preferences.totalPoints || 0}.`, variant: "default" });
      return;
    }
    setIsPurchasingGiftId(item.id);
    const success = await purchaseSymbolicGift(item.id, item.cost, item.name);
    if (success) {
      toast({ title: "Thank You!", description: item.confirmationMessage || `Your gesture "${item.name}" has been made.` });
      if (analytics) { logEvent(analytics, 'item_purchased_from_store', { item_id: item.id, item_name: item.name, item_type: 'symbolic_gift', point_cost: item.cost }); }
    } else {
      toast({ title: "Purchase Failed", description: `Could not complete your gesture for "${item.name}".`, variant: "destructive" });
    }
    setIsPurchasingGiftId(null);
  };


  const userTotalPoints = preferences.totalPoints || 0;

  const filteredAndSortedItems = useMemo(() => {
    let series = (filter === 'all' || filter === 'series') ? getAllExclusiveSeries() : [];
    let themes = (filter === 'all' || filter === 'themes') ? getAllThemeItems() : [];
    let gifts = (filter === 'all' || filter === 'gifts') ? getAllSymbolicGifts() : [];

    if (showUnlockedOnly) {
        series = series.filter(s => preferences.unlockedExclusiveSeriesIds?.includes(s.id));
        themes = themes.filter(t => preferences.unlockedThemeIds?.includes(t.id));
        gifts = []; 
    }

    const sortFn = (a: any, b: any) => {
        if (sortBy === 'cost-asc') return a.cost - b.cost;
        if (sortBy === 'cost-desc') return b.cost - a.cost;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
    };

    return {
        series: series.sort(sortFn),
        themes: themes.sort(sortFn),
        gifts: gifts.sort(sortFn)
    }
  }, [filter, sortBy, showUnlockedOnly, getAllExclusiveSeries, getAllThemeItems, getAllSymbolicGifts, preferences]);


  if (authLoading || !preferencesLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Grace Store...</p>
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
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Grace Store</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Unlock exclusive content with your points.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserDropdownMenu />
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-8 animate-fade-in">
        <Card className="w-full max-w-md mx-auto mb-8 shadow-md bg-accent/10 border-accent/30">
            <CardContent className="p-4 text-center">
                <p className="text-sm text-accent-foreground/80">Your Points Balance:</p>
                <p className="text-3xl font-bold text-accent flex items-center justify-center gap-2">
                    <Award className="h-7 w-7"/> {userTotalPoints}
                </p>
            </CardContent>
        </Card>

        <Card className="w-full max-w-4xl mx-auto mb-8 shadow-sm bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <ToggleGroup type="single" value={filter} onValueChange={(value: ItemType) => value && setFilter(value)} aria-label="Filter items by type">
                        <ToggleGroupItem value="all" aria-label="All items">All</ToggleGroupItem>
                        <ToggleGroupItem value="series" aria-label="Devotional Series">Series</ToggleGroupItem>
                        <ToggleGroupItem value="themes" aria-label="Themes">Themes</ToggleGroupItem>
                        <ToggleGroupItem value="gifts" aria-label="Symbolic Gifts">Gifts</ToggleGroupItem>
                    </ToggleGroup>
                </div>
                 <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-muted-foreground"/>
                    <Label htmlFor="unlocked-only-switch">Unlocked Only</Label>
                    <Switch
                        id="unlocked-only-switch"
                        checked={showUnlockedOnly}
                        onCheckedChange={setShowUnlockedOnly}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="sort-by" className="text-sm font-medium">Sort By:</Label>
                    <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
                        <SelectTrigger id="sort-by" className="w-[180px]">
                            <SelectValue placeholder="Select sort order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cost-asc">Cost: Low to High</SelectItem>
                            <SelectItem value="cost-desc">Cost: High to Low</SelectItem>
                            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>


        {isLoadingContent && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><StoreItemSkeleton /><StoreItemSkeleton /><StoreItemSkeleton /></div>}
        
        {contentError && !isLoadingContent && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Loading Store Items</AlertTitle>
            <AlertDescription>{contentError} Ensure 'exclusive_content_meta' collection is populated in Firestore.</AlertDescription>
          </Alert>
        )}
        
        {filteredAndSortedItems.series.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2"><Gift className="h-6 w-6"/> Exclusive Devotional Series</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedItems.series.map((series) => {
                const isUnlocked = preferences.unlockedExclusiveSeriesIds?.includes(series.id);
                const canAfford = userTotalPoints >= series.cost;
                const isCurrentlyUnlockingThis = isUnlockingId === series.id && savingPreferenceType === 'unlockedSeries';
                const IconComponent = iconMap[series.iconName as IconName] || iconMap.BookOpen;

                return (
                  <Card key={series.id} className={cn("shadow-lg bg-card/80 backdrop-blur-sm border-border/50 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1", !isUnlocked && !canAfford && "opacity-60")}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl text-primary flex items-center gap-2">
                            <IconComponent className="h-5 w-5" />
                            {series.name}
                        </CardTitle>
                        {isUnlocked && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700"><CheckCircle className="mr-1 h-3 w-3" />Unlocked</Badge>}
                       </div>
                      <CardDescription className="text-sm text-muted-foreground line-clamp-3 h-[3.75rem]">{series.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-semibold">{series.days.length} Days</span>
                      </div>
                       <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-semibold text-accent flex items-center gap-1"><Award className="h-4 w-4"/>{series.cost} Points</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {isUnlocked ? (
                        <Button onClick={() => handleViewSeriesContent(series.id, series.name)} className="w-full" variant="outline">
                          <Eye className="mr-2 h-4 w-4"/> View Content
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleUnlockSeries(series)} 
                          disabled={!canAfford || isCurrentlyUnlockingThis} 
                          className="w-full"
                          variant={canAfford ? "primaryGradient" : "secondary"}
                          title={!canAfford ? `You need ${series.cost - userTotalPoints} more points` : `Unlock for ${series.cost} points`}
                        >
                          {isCurrentlyUnlockingThis ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                          {isCurrentlyUnlockingThis ? "Unlocking..." : `Unlock for ${series.cost} Points`}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {filteredAndSortedItems.themes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2"><Palette className="h-6 w-6"/> Custom App Themes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedItems.themes.map((theme) => {
                const isUnlocked = preferences.unlockedThemeIds?.includes(theme.id);
                const isActive = preferences.activeCustomThemeId === theme.id;
                const canAfford = userTotalPoints >= theme.cost;
                const isCurrentlyUnlockingThis = isUnlockingId === theme.id && savingPreferenceType === 'unlockedThemes';
                const isCurrentlyApplyingThis = isApplyingThemeId === theme.id;
                const IconComponent = iconMap[theme.iconName as IconName] || iconMap.Palette;

                return (
                  <Card key={theme.id} className={cn("shadow-lg bg-card/80 backdrop-blur-sm border-border/50 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1", isActive ? 'ring-2 ring-primary' : '', !isUnlocked && !canAfford && "opacity-60")}>
                    <CardHeader>
                       <div className="flex justify-between items-start">
                         <CardTitle className="text-xl text-primary flex items-center gap-2">
                           <IconComponent className="h-5 w-5" />
                           {theme.name}
                         </CardTitle>
                         <div className='flex gap-2'>
                           {isUnlocked && !isActive && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700"><CheckCircle className="mr-1 h-3 w-3" />Unlocked</Badge>}
                           {isActive && <Badge variant="default">Active</Badge>}
                         </div>
                       </div>
                      <CardDescription className="text-sm text-muted-foreground line-clamp-2 h-[2.5rem]">{theme.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      {theme.previewColors && (
                        <div className="flex gap-2 mb-3 items-center">
                          <span className="text-xs text-muted-foreground">Preview:</span>
                          <div style={{ backgroundColor: theme.previewColors.background }} className="h-5 w-5 rounded-full border border-border"/>
                          <div style={{ backgroundColor: theme.previewColors.primary }} className="h-5 w-5 rounded-full border border-border"/>
                          <div style={{ backgroundColor: theme.previewColors.accent }} className="h-5 w-5 rounded-full border border-border"/>
                        </div>
                      )}
                       <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-semibold text-accent flex items-center gap-1"><Award className="h-4 w-4"/>{theme.cost} Points</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {isUnlocked ? (
                        <Button 
                          onClick={() => handleApplyTheme(isActive ? null : theme.id)} 
                          disabled={isCurrentlyApplyingThis || (isSaving && savingPreferenceType === 'activeTheme')}
                          className="w-full" 
                          variant={isActive ? "default" : "outline"}
                        >
                          {isCurrentlyApplyingThis ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (isActive ? <CheckCircle className="mr-2 h-4 w-4"/> : null)}
                          {isCurrentlyApplyingThis ? "Applying..." : (isActive ? "Deactivate Theme" : "Apply Theme")}
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleUnlockTheme(theme)} 
                          disabled={!canAfford || isCurrentlyUnlockingThis} 
                          className="w-full"
                          variant={canAfford ? "primaryGradient" : "secondary"}
                          title={!canAfford ? `You need ${theme.cost - userTotalPoints} more points` : `Unlock for ${theme.cost} points`}
                        >
                          {isCurrentlyUnlockingThis ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                          {isCurrentlyUnlockingThis ? "Unlocking..." : `Unlock for ${theme.cost} Points`}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {filteredAndSortedItems.gifts.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2"><ShoppingBag className="h-6 w-6"/> Symbolic Giving</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedItems.gifts.map((item) => {
                const canAfford = userTotalPoints >= item.cost;
                const isCurrentlyPurchasingThis = isPurchasingGiftId === item.id && savingPreferenceType === 'symbolicGift';
                const IconComponent = iconMap[item.iconName as IconName] || iconMap.Gift;

                return (
                  <Card key={item.id} className={cn("shadow-lg bg-card/80 backdrop-blur-sm border-border/50 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1", !canAfford && "opacity-60")}>
                    <CardHeader>
                      <CardTitle className="text-xl text-primary flex items-center gap-2">
                        <IconComponent className="h-5 w-5" />
                        {item.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground line-clamp-2 h-[2.5rem]">{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-semibold text-accent flex items-center gap-1"><Award className="h-4 w-4"/>{item.cost} Points</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handlePurchaseSymbolicGift(item)} 
                        disabled={!canAfford || isCurrentlyPurchasingThis} 
                        className="w-full"
                        variant={canAfford ? "primaryGradient" : "secondary"}
                        title={!canAfford ? `You need ${item.cost - userTotalPoints} more points` : `${item.name} (${item.cost} Points)`}
                      >
                        {isCurrentlyPurchasingThis ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <IconComponent className="mr-2 h-4 w-4" />}
                        {isCurrentlyPurchasingThis ? "Processing..." : `${item.name.split(' ')[0]} (${item.cost} Pts)`}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {!isLoadingContent && !contentError && filteredAndSortedItems.series.length === 0 && filteredAndSortedItems.themes.length === 0 && filteredAndSortedItems.gifts.length === 0 && (
            <div className="text-center py-10">
                <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4"/>
                <h2 className="text-2xl font-semibold text-primary mb-2">
                    {showUnlockedOnly ? "You haven't unlocked any items yet" : (filter === 'all' ? "The Grace Store is Empty" : `No items match your filter`)}
                </h2>
                <p className="text-muted-foreground">
                    {showUnlockedOnly ? "Explore the store to find new content to unlock!" : (filter === 'all' ? "Check back soon for exclusive items!" : "Try selecting a different category.")}
                </p>
            </div>
        )}
      </main>

      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace. Redeem your blessings.</p>
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
