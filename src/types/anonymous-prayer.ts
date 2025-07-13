
import { Timestamp } from "firebase/firestore";

/**
 * Represents a single prayer request on the Prayer Wall.
 * Can be anonymous or posted by a logged-in user.
 */
export interface PrayerWallItem {
  id: string;
  text: string;
  createdAt: Timestamp;
  prayedForCount: number;
  isAnonymous: boolean;
  authorId?: string; // UID of the user if not anonymous
  authorName?: string; // Display name of the user if not anonymous
}
