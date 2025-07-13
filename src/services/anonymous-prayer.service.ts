
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
  increment,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { PrayerWallItem } from "@/types/anonymous-prayer";
import type { User } from "firebase/auth";

const prayerWallCollection = collection(db, "anonymousPrayers");

/**
 * Adds a new prayer to the public wall.
 *
 * @param text - The content of the prayer request.
 * @param isAnonymous - Whether the prayer should be anonymous.
 * @param user - The authenticated user object, if logged in and not anonymous.
 * @returns The ID of the newly created prayer.
 */
export const addPrayerToWall = async (
  text: string,
  isAnonymous: boolean,
  user: User | null
): Promise<string> => {
  const newPrayer: Omit<PrayerWallItem, "id"> = {
    text,
    createdAt: Timestamp.now(),
    prayedForCount: 0,
    isAnonymous: isAnonymous,
    ...(user && !isAnonymous && {
      authorId: user.uid,
      authorName: user.displayName || user.email || "User",
    }),
  };

  const docRef = await addDoc(prayerWallCollection, newPrayer);
  return docRef.id;
};

/**
 * Increments the "prayed for" counter for a specific prayer.
 *
 * @param prayerId - The ID of the prayer to update.
 */
export const incrementPrayedForCount = async (prayerId: string): Promise<void> => {
  const prayerRef = doc(db, "anonymousPrayers", prayerId);
  await updateDoc(prayerRef, {
    prayedForCount: increment(1),
  });
};

/**
 * Fetches the most recent prayers from the wall.
 *
 * @param count - The number of prayers to fetch.
 * @returns An array of prayers.
 */
export const getRecentPrayers = async (count: number = 50): Promise<PrayerWallItem[]> => {
  const q = query(
    prayerWallCollection,
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as PrayerWallItem)
  );
};
