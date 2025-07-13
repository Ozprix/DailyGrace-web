
import { useUserPreferences } from './use-user-preferences';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLogin: string | null;
}

export const useStreaks = () => {
  const { preferences, isLoaded } = useUserPreferences();

  const streakData: StreakData | null = isLoaded ? {
    currentStreak: preferences.currentStreak || 0,
    longestStreak: preferences.longestStreak || 0,
    lastLogin: preferences.lastStreakDate || null,
  } : null;

  return { streakData, isLoading: !isLoaded };
};
