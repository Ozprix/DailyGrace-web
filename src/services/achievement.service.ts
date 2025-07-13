
import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { allAchievements } from "@/lib/achievements";
import type { UserAchievement } from "@/types/achievements";

const achievementsCollection = (uid: string) =>
  collection(db, "users", uid, "achievements");

/**
 * Checks if a user has already unlocked a specific achievement.
 *
 * @param uid - The user's ID.
 * @param achievementId - The ID of the achievement to check.
 * @returns True if the achievement is unlocked, false otherwise.
 */
const isAchievementUnlocked = async (
  uid: string,
  achievementId: string
): Promise<boolean> => {
  const achievementRef = doc(achievementsCollection(uid), achievementId);
  const docSnap = await getDoc(achievementRef);
  return docSnap.exists();
};

/**
 * Unlocks a new achievement for a user and records the date.
 *
 * @param uid - The user's ID.
 * @param achievementId - The ID of the achievement to unlock.
 */
const unlockAchievement = async (
  uid: string,
  achievementId: string
): Promise<void> => {
  const newUnlock: UserAchievement = {
    achievementId,
    unlockedAt: Timestamp.now(),
  };
  const achievementRef = doc(achievementsCollection(uid), achievementId);
  await setDoc(achievementRef, newUnlock);
};

/**
 * Checks all defined achievements against the user's progress and unlocks any that are newly met.
 *
 * @param uid - The user's ID.
 * @param progress - An object containing the user's current progress for each metric.
 * @returns An array of achievement IDs that were newly unlocked.
 */
export const checkAndUnlockAchievements = async (
  uid: string,
  progress: {
    streak?: number;
    journal_entries?: number;
    devotionals_completed?: number;
    challenges_completed?: number;
  }
): Promise<string[]> => {
  const newlyUnlocked: string[] = [];

  for (const achievement of allAchievements) {
    const isUnlocked = await isAchievementUnlocked(uid, achievement.id);
    if (isUnlocked) {
      continue; // Skip already unlocked achievements
    }

    let criteriaMet = false;
    const { type, count } = achievement.criteria;

    switch (type) {
      case "streak":
        if (progress.streak && progress.streak >= count) {
          criteriaMet = true;
        }
        break;
      case "journal_entries":
        if (progress.journal_entries && progress.journal_entries >= count) {
          criteriaMet = true;
        }
        break;
      case "devotionals_completed":
        if (progress.devotionals_completed && progress.devotionals_completed >= count) {
          criteriaMet = true;
        }
        break;
      case "challenges_completed":
        if (progress.challenges_completed && progress.challenges_completed >= count) {
            criteriaMet = true;
        }
        break;
    }

    if (criteriaMet) {
      await unlockAchievement(uid, achievement.id);
      newlyUnlocked.push(achievement.id);
    }
  }

  return newlyUnlocked;
};
