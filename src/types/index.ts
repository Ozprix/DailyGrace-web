// src/types/index.ts

import type { Timestamp } from "firebase/firestore";
import type { IconName } from "@/lib/nav-links";

// --- CORE CONTENT ---

export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  tags?: string[];
}

export interface DevotionalContent {
  verse: BibleVerse;
  message: string;
  prayerPoint: string;
  themes: string[];
}

export interface Favorite {
  id: string;
  type: 'verse' | 'devotional';
  addedAt: Date;
}

// --- JOURNALING ---

export type Mood = "inspired" | "grateful" | "reflective" | "peaceful" | "troubled";

export interface JournalEntry {
  id: string; // Corresponds to the verseId or challengeId_dayNumber
  context: 'devotional' | 'challenge';
  verseReference?: string; // For devotional entries
  challengeId?: string; // For challenge entries
  challengeDay?: number; // For challenge entries
  text: string;
  mood?: Mood;
  tags?: string[];
  lastSaved: Date | Timestamp;
}

export interface DisplayJournalEntry {
  id: string;
  text: string;
  lastUpdatedAt: Timestamp;
  verse?: {
    reference: string;
    text: string;
  };
  challengeId?: string;
  challengeName?: string;
  challengeDay?: number;
  challengeDayTitle?: string;
}


// --- CHALLENGES ---

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

export interface UserChallengeStatus {
  challengeId: string;
  startedAt: Timestamp;
  currentDay: number;
  completedDays: number[];
  status: 'active' | 'completed';
  lastDayCompletedAt?: Timestamp;
}


// --- QUIZZES ---

export interface Answer {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false';
  options?: Answer[];
  correctAnswer: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface QuizCategoryPublic {
  id: string;
  name: string;
  description: string;
  type: 'Bible Trivia' | 'Devotional Reinforce' | 'Personality';
  iconName: IconName;
}


// --- USER & PREFERENCES ---

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
  favoriteVerseIds?: string[];
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

// --- STORE & EXCLUSIVE CONTENT ---

interface BaseStoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  iconName: IconName;
}

export interface ExclusiveDevotionalDay {
  dayNumber: number;
  title: string;
  reflection: string;
  prayer: string;
}

export interface ExclusiveDevotionalSeries extends BaseStoreItem {
  type: 'devotional_series';
  days: ExclusiveDevotionalDay[];
}

export interface ThemeStoreItem extends BaseStoreItem {
  type: 'theme';
  themeClassName: string;
  previewColors: {
    background: string;
    primary: string;
    accent: string;
  };
}

export interface SymbolicGiftStoreItem extends BaseStoreItem {
  type: 'symbolic_gift';
  confirmationMessage: string;
}

export type StoreItem = ExclusiveDevotionalSeries | ThemeStoreItem | SymbolicGiftStoreItem;


// --- GRACE COMPANION (AI CHAT) ---

export interface GraceCompanionUserInput {
  userMessage: string;
  subscriptionStatus: 'free' | 'premium';
}

export interface GraceCompanionAIOutput {
  aiResponseText: string;
}

export interface BibleSearchQuery {
    searchQuery: string;
}

// --- MISSIONS ---

export interface Mission {
  id: string;
  title: string;
  description: string;
  points: number; // Points awarded on completion
  link?: string; // Optional deep link into the app (e.g., '/prayer-wall')
  actionText?: string; // e.g., "Go to Prayer Wall"
}

export interface UserMission {
  missionId: string;
  completed: boolean;
}

export interface UserWeeklyMissions {
  id: string; // e.g., '2024-w30'
  userId: string;
  missions: UserMission[];
  assignedAt: Timestamp;
}


// --- REFLECTIONS ---

export interface VerseReflection {
  id: string;
  verseId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Timestamp;
  upvotes: number;
  upvotedBy: string[];
}
