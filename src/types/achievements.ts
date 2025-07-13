import { Timestamp } from "firebase/firestore";
import { LucideIcon } from "lucide-react";

/**
 * Defines the structure for a single achievement or badge that can be earned.
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon; // The icon component to display
  criteria: {
    type: "streak" | "journal_entries" | "devotionals_completed" | "challenges_completed";
    count: number;
  };
}

/**
 * Represents an achievement that a user has unlocked.
 * This will be stored in a sub-collection for each user.
 */
export interface UserAchievement {
  achievementId: string;
  unlockedAt: Timestamp;
}
