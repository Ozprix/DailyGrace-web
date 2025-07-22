// src/lib/bible-verses.ts
import { BibleVerse } from '@/types';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase/config';

// A mock function to get a verse by ID
export const getVerseById = async (id: string): Promise<BibleVerse | null> => {
  try {
    const verseDoc = await getDoc(doc(db, 'verses', id));
    if (verseDoc.exists()) {
      return { id: verseDoc.id, ...verseDoc.data() } as BibleVerse;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching verse ${id}:`, error);
    return null;
  }
};

export const getAllVerses = async (): Promise<BibleVerse[]> => {
  try {
    const versesCollection = await getDocs(collection(db, 'verses'));
    return versesCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BibleVerse));
  } catch (error) {
    console.error('Error fetching all verses:', error);
    return [];
  }
};
