// src/app/settings/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell, Info, Loader2, ArrowLeft, MessageSquareText, MessageSquareMore, Sparkles, Bookmark, Edit3, User as UserLucide, ShieldCheck, Award, UserCircle, CalendarPlus, CalendarClock, Flame, Star, WifiOff, DownloadCloud, Heart, LayoutGrid, Mail, UserPlus } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { format } from 'date-fns';
import UserDropdownMenu from '@/components/user-dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { syncAllDataForOffline } from '@/services/offline-sync.service';
import { Input } from '@/components/ui/input';
import type { NotificationFrequency, ContentStyle } from '@/types';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { preferences, updateFrequency, updateContentStyle, updateChallengeReminders, isLoaded: prefsLoaded, isSaving, savingPreferenceType, updateWeeklyDigest } = useUserPreferences();
  const router = useRouter();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);


  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'settings_page' });
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleOfflineSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    toast({ title: "Starting Offline Sync", description: "This may take a moment..." });
    const result = await syncAllDataForOffline(user.uid);
    if (result.success) {
        toast({ title: "Sync Complete!", description: "Your data is now available offline." });
    } else {
        toast({ title: "Sync Failed", description: result.error, variant: "destructive" });
    }
    setIsSyncing(false);
  };

  const handleCopyReferral = () => {
    if (!user) return;
    const referralLink = `${window.location.origin}/signup?ref=${user.uid}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copied!",
      description: "Your referral link has been copied to your clipboard.",
    });
     if (analytics) {
      logEvent(analytics, 'referral_link_copied');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  const handleFrequencyChange = async (value: string) => {
    await updateFrequency(value as NotificationFrequency);
  };

  const handleContentStyleChange = async (value: string) => {
    await updateContentStyle(value as ContentStyle);
  };

  const handleChallengeRemindersChange = async (checked: boolean) => {
    await updateChallengeReminders(checked);
  };

  const handleWeeklyDigestChange = async (checked: boolean) => {
    await updateWeeklyDigest(checked);
  };

  const navigateTo = (path: string, pageName: string) => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: pageName, from_page: 'settings_dropdown_or_page_interaction' });
    }
    router.push(path);
  };

  const handleBackNavigation = () => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: 'previous_page_from_settings', from_page: 'settings_page_header_back_arrow' });
    }
    router.back();
  };

  const renderSkeletons = () => (
    <>
      <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><UserLucide className="h-5 w-5 text-primary"/> Profile</CardTitle>
          <CardDescription>Your account information and subscription.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email-skeleton" className="text-sm font-medium text-muted-foreground">Email</Label>
            <Skeleton className="h-7 w-3/4 mt-1 rounded-md" />
          </div>
          {user.displayName && (
             <div>
              <Label htmlFor="displayName-skeleton" className="text-sm font-medium text-muted-foreground">Display Name</Label>
              <Skeleton className="h-7 w-1/2 mt-1 rounded-md" />
            </div>
          )}
          <div>
            <Label htmlFor="member-since-skeleton" className="text-sm font-medium text-muted-foreground">Member Since</Label>
            <Skeleton className="h-7 w-1/3 mt-1 rounded-md" />
          </div>
          <div>
            <Label htmlFor="last-active-skeleton" className="text-sm font-medium text-muted-foreground">Last Active</Label>
            <Skeleton className="h-7 w-1/3 mt-1 rounded-md" />
          </div>
          <div>
            <Label htmlFor="points-skeleton" className="text-sm font-medium text-muted-foreground">Total Points</Label>
            <Skeleton className="h-7 w-1/4 mt-1 rounded-md" />
          </div>
          <div>
            <Label htmlFor="streak-skeleton" className="text-sm font-medium text-muted-foreground">Streaks</Label>
            <Skeleton className="h-7 w-1/3 mt-1 rounded-md" />
            <Skeleton className="h-7 w-1/3 mt-1 rounded-md" />
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><MessageSquareMore className="h-5 w-5 text-primary"/> Content Preferences</CardTitle>
          <CardDescription>Choose the length of devotional messages and prayers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Devotional Style</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5 rounded-full" /> <Skeleton className="h-5 w-48 rounded-md" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5 rounded-full" /> <Skeleton className="h-5 w-56 rounded-md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Bell className="h-5 w-5 text-primary"/> Notification Settings</CardTitle>
          <CardDescription>Control how often you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="notification-frequency-skeleton" className="text-sm font-medium">Frequency</Label>
            <Skeleton className="h-10 w-full mt-1 rounded-md" />
          </div>
           <div className="space-y-2">
            <Label className="text-sm font-medium">Challenge Reminders</Label>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-5 w-48 rounded-md" />
            </div>
          </div>
          <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary-foreground">
            <Info className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold text-primary">Please Note</AlertTitle>
            <AlertDescription className="text-foreground/80">
              Changing notification settings currently saves your preference. The actual delivery based on these settings requires backend implementation and is not yet active.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Bookmark className="h-5 w-5 text-primary"/> My Content</CardTitle>
          <CardDescription>Access your saved items.</CardDescription>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full py-4 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
         <Button variant="ghost" size="icon" onClick={handleBackNavigation} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Settings</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Manage your preferences.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserDropdownMenu />
        </div>
      </header>

      <main className="flex-grow w-full container mx-auto px-4 py-8 space-y-8">
        {!prefsLoaded && !authLoading ? renderSkeletons() : (
        <>
          <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><UserLucide className="h-5 w-5 text-primary"/> Profile & Stats</CardTitle>
              <CardDescription>Your account information and activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <UserCircle className="h-4 w-4"/> Email
                </Label>
                <p id="email" className="text-md text-foreground/90 ml-5">{user.email}</p>
              </div>
              {user.displayName && (
                <div>
                  <Label htmlFor="displayName" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <UserCircle className="h-4 w-4"/> Display Name
                  </Label>
                  <p id="displayName" className="text-md text-foreground/90 ml-5">{user.displayName}</p>
                </div>
              )}
              {user.metadata.creationTime && (
                <div>
                  <Label htmlFor="memberSince" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <CalendarPlus className="h-4 w-4"/> Member Since
                  </Label>
                  <p id="memberSince" className="text-md text-foreground/90 ml-5">{format(new Date(user.metadata.creationTime), 'MMMM d, yyyy')}</p>
                </div>
              )}
              {user.metadata.lastSignInTime && (
                 <div>
                  <Label htmlFor="lastActive" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4"/> Last Active
                  </Label>
                  <p id="lastActive" className="text-md text-foreground/90 ml-5">{format(new Date(user.metadata.lastSignInTime), 'MMMM d, yyyy, p')}</p>
                </div>
              )}
              <div>
                  <Label htmlFor="totalPoints" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Award className="h-4 w-4"/> Total Points
                  </Label>
                  <p id="totalPoints" className="text-md text-foreground/90 ml-5 flex items-center gap-1.5">
                      {preferences.totalPoints || 0}
                  </p>
              </div>
              {(preferences.currentStreak || 0) > 0 && (
                 <div>
                    <Label htmlFor="currentStreak" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <Flame className="h-4 w-4"/> Current Daily Streak
                    </Label>
                    <p id="currentStreak" className="text-md text-foreground/90 ml-5">{preferences.currentStreak} days</p>
                </div>
              )}
              {(preferences.longestStreak || 0) > 0 && (
                <div>
                    <Label htmlFor="longestStreak" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <Star className="h-4 w-4"/> Longest Daily Streak
                    </Label>
                    <p id="longestStreak" className="text-md text-foreground/90 ml-5">{preferences.longestStreak} days</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary"/> Refer a Friend</CardTitle>
              <CardDescription>Invite friends and you both earn 100 Grace Points!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Share your unique link with friends. When they sign up using this link, you both get a bonus.</p>
                <div className="flex items-center space-x-2">
                    <Input value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${user.uid}`} readOnly />
                    <Button onClick={handleCopyReferral}>Copy</Button>
                </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><DownloadCloud className="h-5 w-5 text-primary"/> Offline Mode</CardTitle>
                <CardDescription>Download your data for access without an internet connection.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleOfflineSync} disabled={isSyncing} className="w-full">
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <WifiOff className="mr-2 h-4 w-4" />
                      Download Data for Offline Use
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This will store your journal entries, favorites, and upcoming devotionals on this device.
                </p>
              </CardContent>
            </Card>

          <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><MessageSquareMore className="h-5 w-5 text-primary"/> Content Preferences</CardTitle>
              <CardDescription>Choose the length of AI-generated devotional messages and prayers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Devotional Style</Label>
                <RadioGroup
                  value={preferences.contentStyle}
                  onValueChange={handleContentStyleChange}
                  className="mt-2 space-y-2"
                  disabled={(isSaving && savingPreferenceType === 'contentStyle')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="short" id="content-short" />
                    <Label htmlFor="content-short" className="font-normal flex items-center gap-1.5">
                      <MessageSquareText className="h-4 w-4 text-muted-foreground"/> Short & Sweet (Single sentence)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="detailed"
                      id="content-detailed"
                    />
                    <Label 
                        htmlFor="content-detailed" 
                        className="font-normal flex items-center gap-1.5"
                    >
                     <MessageSquareMore className="h-4 w-4 text-muted-foreground"/> Detailed Reflection (1-2 paragraphs)
                    </Label>
                  </div>
                </RadioGroup>
                {isSaving && savingPreferenceType === 'contentStyle' && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving style...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Bell className="h-5 w-5 text-primary"/> Notification Settings</CardTitle>
              <CardDescription>Control how often you receive notifications and emails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="notification-frequency" className="text-sm font-medium">Push Notification Frequency</Label>
                  <Select
                    value={preferences.frequency}
                    onValueChange={handleFrequencyChange}
                    disabled={isSaving && savingPreferenceType === 'frequency'}
                  >
                    <SelectTrigger id="notification-frequency" className="w-full mt-1">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="once">Once a day</SelectItem>
                      <SelectItem value="twice">Twice a day</SelectItem>
                      <SelectItem value="thrice">Three times a day</SelectItem>
                    </SelectContent>
                  </Select>
                {isSaving && savingPreferenceType === 'frequency' && (
                   <p className="text-sm text-muted-foreground mt-2 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving frequency...
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenge-reminders" className="text-sm font-medium">Challenge Progress Reminders</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Switch
                    id="challenge-reminders"
                    checked={preferences.enableChallengeReminders}
                    onCheckedChange={handleChallengeRemindersChange}
                    disabled={isSaving && savingPreferenceType === 'challengeReminders'}
                  />
                  <Label htmlFor="challenge-reminders" className="font-normal text-muted-foreground">
                    Receive push notifications for active challenges
                  </Label>
                </div>
                {isSaving && savingPreferenceType === 'challengeReminders' && (
                   <p className="text-sm text-muted-foreground mt-2 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving reminder preference...
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekly-digest" className="text-sm font-medium">Email Digest</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Switch
                    id="weekly-digest"
                    checked={preferences.enableWeeklyDigest}
                    onCheckedChange={handleWeeklyDigestChange}
                    disabled={isSaving && savingPreferenceType === 'weeklyDigest'}
                  />
                  <Label htmlFor="weekly-digest" className="font-normal text-muted-foreground">
                    Receive a weekly email summary of your activity
                  </Label>
                </div>
                {isSaving && savingPreferenceType === 'weeklyDigest' && (
                   <p className="text-sm text-muted-foreground mt-2 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving digest preference...
                  </p>
                )}
              </div>


              <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary-foreground">
                <Info className="h-5 w-5 text-primary" />
                <AlertTitle className="font-semibold text-primary">Please Note</AlertTitle>
                <AlertDescription className="text-foreground/80">
                  Changing notification settings currently saves your preference. The actual delivery of notifications and emails requires backend implementation and is not yet active.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-primary"/> My Content</CardTitle>
              <CardDescription>Access your saved items, journal entries, and unlocked exclusives.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full sm:w-auto" onClick={() => navigateTo('/my-content', 'my_content_from_settings')}>
                <Link href="/my-content" className="flex items-center justify-center gap-2">
                  <LayoutGrid /> Go to My Content Hub
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
        )}
      </main>

      <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Daily Grace. Manage your spiritual journey.
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
}
