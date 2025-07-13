import { Flame, BookCheck, Trophy, Feather } from "lucide-react";
import type { Achievement } from "@/types/achievements";

export const allAchievements: Achievement[] = [
  // Streak Achievements
  {
    id: "streak_7",
    name: "Weekly Worshipper",
    description: "Maintain a 7-day streak.",
    icon: Flame,
    criteria: { type: "streak", count: 7 },
  },
  {
    id: "streak_30",
    name: "Monthly Mentor",
    description: "Maintain a 30-day streak.",
    icon: Flame,
    criteria: { type: "streak", count: 30 },
  },

  // Journaling Achievements
  {
    id: "journal_1",
    name: "First Reflection",
    description: "Write your first journal entry.",
    icon: Feather,
    criteria: { type: "journal_entries", count: 1 },
  },
  {
    id: "journal_10",
    name: "Faithful Scribe",
    description: "Write 10 journal entries.",
    icon: Feather,
    criteria: { type: "journal_entries", count: 10 },
  },

  // Devotional Achievements
  {
    id: "devotional_1",
    name: "First Devotional",
    description: "Complete your first daily devotional.",
    icon: BookCheck,
    criteria: { type: "devotionals_completed", count: 1 },
  },
  {
    id: "devotional_25",
    name: "Devotional Devotee",
    description: "Complete 25 devotionals.",
    icon: BookCheck,
    criteria: { type: "devotionals_completed", count: 25 },
  },

  // Challenge Achievements
  {
    id: "challenge_1",
    name: "Challenge Champion",
    description: "Complete your first spiritual challenge.",
    icon: Trophy,
    criteria: { type: "challenges_completed", count: 1 },
  },
];
