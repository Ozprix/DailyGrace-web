
import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    arrayUnion,
    Timestamp,
    query,
    where,
    writeBatch,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase/config";
  import type {
    PrayerCircle,
    PrayerCircleMember,
    PrayerRequest,
  } from "@/types/prayer-circle";
  
  const prayerCirclesCollection = collection(db, "prayerCircles");
  
  /**
   * Creates a new Prayer Circle.
   *
   * @param name - The name of the circle.
   * @param description - A brief description of the circle.
   * @param ownerId - The UID of the user creating the circle.
   * @param ownerName - The name of the owner.
   * @param isPrivate - Whether the circle is private or public.
   * @returns The ID of the newly created prayer circle.
   */
  export const createPrayerCircle = async (
    name: string,
    description: string,
    ownerId: string,
    ownerName: string,
    isPrivate: boolean
  ): Promise<string> => {
    const owner: PrayerCircleMember = {
      uid: ownerId,
      name: ownerName,
      role: "owner",
      joinedAt: Timestamp.now(),
    };
  
    const newCircle: Omit<PrayerCircle, "id"> = {
      name,
      description,
      ownerId,
      members: [owner],
      memberUids: [ownerId],
      createdAt: Timestamp.now(),
      isPrivate,
    };
  
    const docRef = await addDoc(prayerCirclesCollection, newCircle);
    return docRef.id;
  };
  
  /**
   * Fetches a single Prayer Circle by its ID.
   *
   * @param circleId - The ID of the prayer circle to fetch.
   * @returns The prayer circle data or null if not found.
   */
  export const getPrayerCircle = async (
    circleId: string
  ): Promise<PrayerCircle | null> => {
    const docRef = doc(db, "prayerCircles", circleId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as PrayerCircle;
    }
    return null;
  };
  
  /**
   * Fetches all public Prayer Circles.
   *
   * @returns An array of public prayer circles.
   */
  export const getPublicPrayerCircles = async (): Promise<PrayerCircle[]> => {
    const q = query(prayerCirclesCollection, where("isPrivate", "==", false));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PrayerCircle)
    );
  };
  
  /**
   * Adds a member to a Prayer Circle.
   *
   * @param circleId - The ID of the circle to join.
   * @param userId - The UID of the user joining.
   * @param userName - The name of the user joining.
   */
  export const joinPrayerCircle = async (
    circleId: string,
    userId: string,
    userName: string
  ): Promise<void> => {
    const circleRef = doc(db, "prayerCircles", circleId);
    const newMember: PrayerCircleMember = {
      uid: userId,
      name: userName,
      role: "member",
      joinedAt: Timestamp.now(),
    };
  
    await updateDoc(circleRef, {
      members: arrayUnion(newMember),
      memberUids: arrayUnion(userId),
    });
  };
  
  // --- Prayer Request Functions ---
  
  /**
   * Adds a prayer request to a specific Prayer Circle.
   *
   * @param circleId - The ID of the circle.
   * @param authorId - The UID of the user making the request.
   * @param authorName - The name of the user.
   * @param text - The content of the prayer request.
   * @returns The ID of the new prayer request.
   */
  export const addPrayerRequest = async (
    circleId: string,
    authorId: string,
    authorName: string,
    text: string
  ): Promise<string> => {
    const requestsCollection = collection(
      db,
      "prayerCircles",
      circleId,
      "requests"
    );
    const newRequest: Omit<PrayerRequest, "id"> = {
      authorId,
      authorName,
      text,
      createdAt: Timestamp.now(),
      prayedForBy: [],
    };
    const docRef = await addDoc(requestsCollection, newRequest);
    return docRef.id;
  };
  
  /**
   * Fetches all prayer requests for a given Prayer Circle.
   *
   * @param circleId - The ID of the circle.
   * @returns An array of prayer requests.
   */
  export const getPrayerRequests = async (
    circleId: string
  ): Promise<PrayerRequest[]> => {
    const requestsCollection = collection(
      db,
      "prayerCircles",
      circleId,
      "requests"
    );
    const q = query(requestsCollection);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PrayerRequest)
    );
  };
  
  /**
   * Marks a prayer request as "prayed for" by a user.
   *
   * @param circleId - The ID of the circle containing the request.
   * @param requestId - The ID of the prayer request.
   * @param userId - The UID of the user who prayed.
   */
  export const markAsPrayedFor = async (
    circleId: string,
    requestId: string,
    userId: string
  ): Promise<void> => {
    const requestRef = doc(
      db,
      "prayerCircles",
      circleId,
      "requests",
      requestId
    );
    await updateDoc(requestRef, {
      prayedForBy: arrayUnion(userId),
    });
  };
  
