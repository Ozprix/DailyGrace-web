
import { Timestamp } from "firebase/firestore";

/**
 * Represents a single prayer request within a Prayer Circle.
 */
export interface PrayerRequest {
  id: string;
  authorId: string;
  authorName: string; // Denormalized for easy display
  text: string;
  createdAt: Timestamp;
  prayedForBy: string[]; // Array of user IDs who have prayed
}

/**
 * Represents a user's membership within a Prayer Circle.
 */
export interface PrayerCircleMember {
  uid: string;
  name: string;
  role: "owner" | "member";
  joinedAt: Timestamp;
}

/**
 * Represents a Prayer Circle.
 */
export interface PrayerCircle {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: PrayerCircleMember[];
  memberUids: string[]; // For easy security rule checks
  createdAt: Timestamp;
  isPrivate: boolean; // Private circles require an invitation
  // We will add prayer requests as a sub-collection
}
