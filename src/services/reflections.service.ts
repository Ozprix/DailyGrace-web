// src/services/reflections.service.ts
import {
  collection,
  addDoc,
  doc,
  Timestamp,
  getDocs,
  query,
  orderBy,
  runTransaction,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { VerseReflection } from "@/types";

const getReflectionsCollection = (verseId: string) =>
  collection(db, "bible_verses", verseId, "reflections");

export const addReflection = async (
  verseId: string,
  authorId: string,
  authorName: string,
  text: string
): Promise<VerseReflection> => {
  const newReflectionData = {
    verseId,
    authorId,
    authorName,
    text,
    createdAt: Timestamp.now(),
    upvotes: 0,
    upvotedBy: [],
  };

  const docRef = await addDoc(getReflectionsCollection(verseId), newReflectionData);
  return { id: docRef.id, ...newReflectionData };
};

export const getReflectionsForVerse = async (verseId: string): Promise<VerseReflection[]> => {
  const q = query(
    getReflectionsCollection(verseId),
    orderBy("createdAt", "desc"),
    limit(25)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as VerseReflection)
  );
};

export const upvoteReflection = async (
  verseId: string,
  reflectionId: string,
  userId: string
): Promise<boolean> => {
  const reflectionRef = doc(db, "bible_verses", verseId, "reflections", reflectionId);

  try {
    await runTransaction(db, async (transaction) => {
      const reflectionDoc = await transaction.get(reflectionRef);
      if (!reflectionDoc.exists()) {
        throw new Error("Document does not exist!");
      }

      const reflectionData = reflectionDoc.data() as VerseReflection;
      if (reflectionData.upvotedBy.includes(userId)) {
        // User already upvoted, so we downvote
        transaction.update(reflectionRef, {
          upvotes: reflectionData.upvotes - 1,
          upvotedBy: reflectionData.upvotedBy.filter(uid => uid !== userId),
        });
      } else {
        // User has not upvoted, so we upvote
        transaction.update(reflectionRef, {
          upvotes: reflectionData.upvotes + 1,
          upvotedBy: [...reflectionData.upvotedBy, userId],
        });
      }
    });
    return true;
  } catch (e) {
    console.error("Upvote transaction failed: ", e);
    return false;
  }
};
