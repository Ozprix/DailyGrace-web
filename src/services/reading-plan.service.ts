// src/services/reading-plan.service.ts
import { collection, doc, getDocs, getDoc, addDoc, setDoc, query, where, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config'; // Import the initialized Firestore instance
import { ReadingPlan, UserReadingProgress } from '@/types/reading-plan'; // Import the ReadingPlan and UserReadingProgress types

const readingPlansCollectionRef = collection(db, 'readingPlans');
const userReadingProgressCollectionRef = collection(db, 'userReadingProgresses');

export async function getReadingPlans(): Promise<ReadingPlan[]> {
  const querySnapshot = await getDocs(readingPlansCollectionRef);
  const readingPlans: ReadingPlan[] = [];
  querySnapshot.forEach((doc) => {
    readingPlans.push({ id: doc.id, ...doc.data() } as ReadingPlan);
  });
  return readingPlans;
}

export async function getReadingPlanById(id: string): Promise<ReadingPlan | null> {
  const docRef = doc(db, 'readingPlans', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ReadingPlan;
  } else {
    return null;
  }
}

export async function addReadingPlan(readingPlan: Omit<ReadingPlan, 'id'>): Promise<string> {
  const docRef = await addDoc(readingPlansCollectionRef, readingPlan);
  return docRef.id;
}

export async function getUserReadingProgress(userId: string, readingPlanId: string): Promise<UserReadingProgress | null> {
  const progressDocId = `${userId}_${readingPlanId}`;
  const docRef = doc(userReadingProgressCollectionRef, progressDocId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as UserReadingProgress;
  } else {
    return null;
  }
}

// New function to get all progress documents for a specific user
export async function getAllUserProgress(userId: string): Promise<UserReadingProgress[]> {
  const q = query(userReadingProgressCollectionRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReadingProgress));
}


export async function createUserReadingProgress(userId: string, readingPlanId: string): Promise<UserReadingProgress> {
  const progressDocId = `${userId}_${readingPlanId}`;
  const newProgressData: Omit<UserReadingProgress, 'id'> = {
    userId,
    readingPlanId,
    completedDays: [],
    startedAt: Timestamp.now(),
    status: 'active',
  };
  await setDoc(doc(userReadingProgressCollectionRef, progressDocId), newProgressData);
  return { id: progressDocId, ...newProgressData };
}

export async function updateUserReadingProgress(progressId: string, progressUpdate: Partial<UserReadingProgress>): Promise<void> {
  const docRef = doc(userReadingProgressCollectionRef, progressId);
  await updateDoc(docRef, progressUpdate);
}
