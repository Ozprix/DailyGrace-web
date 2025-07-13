
import { Timestamp } from "firebase/firestore";

export interface Reading {
  day: number;
  title: string;
  prompt: string;
  verseReference: string;
  prayerFocus: string;
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  readings: Reading[];
}

export interface UserReadingProgress {
  id: string; // Document ID in Firestore (e.g., userId_planId)
  userId: string;
  readingPlanId: string;
  completedDays: number[]; // Array of day numbers that the user has completed
  startedAt: Timestamp; // Use Firestore Timestamp
  completedAt?: Timestamp; // Optional timestamp when the user completed the plan
  lastDayCompletedAt?: Timestamp; // To track daily activity
  status: 'active' | 'completed' | 'abandoned'; // Status of the user's progress
}
