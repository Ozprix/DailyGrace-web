// src/functions/src/types/index.ts

// Temporarily disabled for performance testing
// import type { Timestamp } from 'firebase-admin/firestore';

// Placeholder types for performance testing
export interface PlaceholderType {
  id: string;
  name: string;
}

// This file should contain type definitions relevant to your backend functions.
// Ensure these types align with the data structures your functions expect and use.

export interface UserPreferences {
  frequency: 'off' | 'once' | 'twice' | 'thrice';
  enableWeeklyDigest?: boolean;
  // Add streak data for smart notifications
  currentStreak?: number;
  lastStreakDate?: string; // YYYY-MM-DD
}

export interface UserData {
  fcmTokens?: string[];
  displayName?: string;
  // Add other user data fields
}

export interface Devotional {
  verse: {
    id: string;
    reference: string;
    text: string;
  };
  message: string;
  prayerPoint: string;
  themes: string[];
  imageUrl?: string; // Added optional imageUrl for notifications as per src/services/notification.service.ts usage
}

export interface NotificationResult {
  success: boolean;
  message: string;
  successCount: number; // Added missing property
  failureCount: number; // Added missing property
  error?: string; // Optional error details
}

// Add any other types your backend functions need
// For example, types for challenge data if notifications relate to challenges
export interface Challenge {
    id: string;
    name: string;
    // other challenge properties
}
