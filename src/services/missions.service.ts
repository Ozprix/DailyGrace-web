// src/services/missions.service.ts
import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Mission, UserWeeklyMissions, UserMission } from "@/types";

// Helper to get a consistent week identifier string (e.g., "2024-w30")
const getWeekId = (date: Date): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Sunday is 0, so we use || 7 to make it the end of the week
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  // Return YYYY-wWW
  return `${d.getUTCFullYear()}-w${weekNo}`;
};

const userMissionsCollection = (uid: string) => collection(db, "users", uid, "userMissions");

/**
 * Gets or creates the weekly missions for a user.
 * If missions for the current week don't exist, it assigns new random ones.
 */
export const getOrCreateWeeklyMissions = async (
  userId: string,
  allMissions: Mission[]
): Promise<UserWeeklyMissions | null> => {
  if (!allMissions || allMissions.length === 0) {
    console.warn("No missions available to assign.");
    return null;
  }
  
  const currentWeekId = getWeekId(new Date());
  const weeklyMissionsDocRef = doc(userMissionsCollection(userId), currentWeekId);

  const docSnap = await getDoc(weeklyMissionsDocRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as UserWeeklyMissions;
  } else {
    // Assign new missions for the week
    const missionsToAssign: UserMission[] = [];
    const shuffledMissions = [...allMissions].sort(() => 0.5 - Math.random());
    const selectedMissions = shuffledMissions.slice(0, 3); // Assign 3 random missions

    for (const mission of selectedMissions) {
      missionsToAssign.push({ missionId: mission.id, completed: false });
    }

    const newWeeklyMissions: UserWeeklyMissions = {
      id: currentWeekId,
      userId,
      missions: missionsToAssign,
      assignedAt: Timestamp.now(),
    };

    await setDoc(weeklyMissionsDocRef, newWeeklyMissions);
    return newWeeklyMissions;
  }
};

/**
 * Marks a specific mission as complete for a user for a given week.
 */
export const completeMission = async (
  userId: string,
  weekId: string,
  missionId: string
): Promise<boolean> => {
    const weeklyMissionsDocRef = doc(userMissionsCollection(userId), weekId);
    
    try {
        await runTransaction(db, async (transaction) => {
            const weeklyDoc = await transaction.get(weeklyMissionsDocRef);
            if (!weeklyDoc.exists()) {
                throw new Error("Weekly missions document not found.");
            }

            const data = weeklyDoc.data() as UserWeeklyMissions;
            const missionIndex = data.missions.findIndex(m => m.missionId === missionId);

            if (missionIndex === -1) {
                throw new Error("Mission not found for this week.");
            }

            if (data.missions[missionIndex].completed) {
                console.log("Mission already completed.");
                return; // Already complete, do nothing.
            }

            const updatedMissions = [...data.missions];
            updatedMissions[missionIndex] = { ...updatedMissions[missionIndex], completed: true };

            transaction.update(weeklyMissionsDocRef, { missions: updatedMissions });
        });
        return true;
    } catch (error) {
        console.error("Failed to complete mission:", error);
        return false;
    }
};
