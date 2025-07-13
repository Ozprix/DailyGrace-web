// functions/src/types/index.ts

import type { Timestamp } from 'firebase-admin/firestore';

// --- CORE TYPES ---

export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  tags?: string[];
}

export interface Devotional {
  verse: BibleVerse;
  message: string;
  prayerPoint: string;
  themes: string[];
  imageUrl?: string;
}

export interface ChallengeDay {
  day: number;
  title: string;
  prompt: string;
  verseReference: string;
  prayerFocus: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  days: ChallengeDay[];
}

// --- USER-RELATED TYPES ---

export type NotificationFrequency = 'off' | 'once' | 'twice' | 'thrice';
export type ContentStyle = 'short' | 'detailed';
export type SubscriptionStatus = 'free' | 'premium';

export interface UserPreferences {
  frequency: NotificationFrequency;
  contentStyle: ContentStyle;
  enableChallengeReminders: boolean;
  enableWeeklyDigest: boolean;
  subscriptionStatus: SubscriptionStatus;
  totalPoints: number;
  unlockedExclusiveSeriesIds: string[];
  unlockedThemeIds: string[];
  activeCustomThemeId: string | null;
  currentStreak: number;
  lastStreakDate: string | null; // Storing as YYYY-MM-DD
  longestStreak: number;
  verseOfTheDayId: string;
  onboardingCompleted: boolean;
  lastChallengeCompletedAt: Timestamp | null;
  dailyContentLastUpdated: string | null; // Storing as YYYY-MM-DD
}

export interface UserData {
  fcmTokens?: string[];
  displayName?: string;
  activeChallengeIds?: string[];
}

// --- FUNCTION-SPECIFIC TYPES ---

export interface NotificationResult {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  error?: string;
}
