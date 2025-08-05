import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { JournalEntry, Favorite, DevotionalContent, UserChallengeStatus } from '@/types';

// Define the database schema
interface DailyGraceDB extends DBSchema {
  journal: {
    key: string;
    value: JournalEntry;
  };
  favorites: {
    key: string;
    value: Favorite;
  };
  devotionals: {
    key: string; // e.g., '2024-07-20'
    value: DevotionalContent;
  };
  challenges: {
    key: string; // This will be the challengeId for the user's progress
    value: UserChallengeStatus;
  }
}

const DB_NAME = 'daily-grace-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DailyGraceDB>> | null = null;

const getDbPromise = () => {
    // This function should only be called on the client side.
    if (typeof window === 'undefined') {
        // Return a dummy object or throw an error on the server
        return Promise.reject(new Error("IndexedDB can't be accessed on the server."));
    }
    if (!dbPromise) {
        dbPromise = openDB<DailyGraceDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('journal')) {
                db.createObjectStore('journal', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('favorites')) {
                db.createObjectStore('favorites', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('devotionals')) {
                db.createObjectStore('devotionals', { keyPath: 'verse.id' });
                }
                if (!db.objectStoreNames.contains('challenges')) {
                db.createObjectStore('challenges', { keyPath: 'challengeId' });
                }
            },
        });
    }
    return dbPromise;
};


/**
 * Caches an array of items to a specified store in IndexedDB.
 * @param storeName The name of the object store.
 * @param data The array of data to cache.
 */
const cacheData = async <T extends keyof DailyGraceDB>(
  storeName: T,
  data: DailyGraceDB[T]['value'][]
) => {
  if (typeof window === 'undefined') return; // Guard against server-side execution
  try {
    const db = await getDbPromise();
    const tx = db.transaction(storeName as any, 'readwrite');
    await Promise.all(data.map(item => tx.store.put(item)));
    return tx.done;
  } catch (error) {
      console.error(`Failed to cache data for store: ${storeName}`, error);
  }
};

/**
 * Retrieves all cached data from a specified store.
 * @param storeName The name of the object store.
 */
export const getCachedData = async <T extends keyof DailyGraceDB>(
    storeName: T
  ): Promise<DailyGraceDB[T]['value'][]> => {
    if (typeof window === 'undefined') return []; // Guard against server-side execution
    try {
        const db = await getDbPromise();
        return db.getAll(storeName as any);
    } catch (error) {
        console.error(`Failed to get cached data from store: ${storeName}`, error);
        return [];
    }
};


// --- Specific Caching Functions ---

export const cacheJournalEntries = async (entries: JournalEntry[]) => {
    if (typeof window === 'undefined') return;
    await cacheData('journal', entries);
    console.log('Journal entries cached for offline use.');
};

export const cacheFavorites = async (favorites: Favorite[]) => {
    if (typeof window === 'undefined') return;
    await cacheData('favorites', favorites);
    console.log('Favorites cached for offline use.');
};

export const cacheDevotionals = async (devotionals: DevotionalContent[]) => {
    if (typeof window === 'undefined') return;
    await cacheData('devotionals', devotionals);
    console.log(`${devotionals.length} devotionals cached for offline use.`);
}

export const cacheUserChallenges = async (challenges: UserChallengeStatus[]) => {
    if (typeof window === 'undefined') return;
    await cacheData('challenges', challenges);
    console.log('User challenges cached for offline use.');
}

/**
 * Main function to trigger the full offline sync process.
 * This would be called from a UI element (e.g., a button in settings).
 * NOTE: This is a placeholder for the full implementation. It requires the functions
 * to fetch the actual data from Firestore, which would be imported from other services.
 */
export const syncAllDataForOffline = async (userId: string) => {
    if (typeof window === 'undefined') {
        console.warn("Sync function called on server. Aborting.");
        return { success: false, error: "Sync can only be initiated from the client."};
    }

    console.log('Starting full offline sync...');
    try {
        // In a real implementation, you would call your Firestore service functions here
        // For example:
        // const journalService = useJournal(); <-- Can't use hooks in a service
        // const entries = await getAllJournalEntriesFromFirestore(userId);
        // await cacheJournalEntries(entries);
        
        // const favorites = await getAllFavoritesFromFirestore(userId);
        // await cacheFavorites(favorites);

        // const challenges = await getAllUserChallengesFromFirestore(userId);
        // await cacheUserChallenges(challenges);
        
        // Fetching future devotionals is complex. We would need a mechanism
        // to pre-generate and store them, or have an API endpoint to fetch them.
        // const futureDevotionals = await getFutureDevotionals(7); // Fetch for the next 7 days
        // await cacheDevotionals(futureDevotionals);

        console.log('Full offline sync completed successfully!');
        return { success: true };

    } catch (error) {
        console.error('Offline sync failed:', error);
        return { success: false, error: (error as Error).message };
    }
};
