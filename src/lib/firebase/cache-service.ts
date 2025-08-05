// src/lib/firebase/cache-service.ts
import { db } from './config';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';

// In-memory cache for better performance
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Optimized query configurations
const optimizedQueries = {
  // Get a single document with caching
  async getDocument<T>(path: string, id: string): Promise<T | null> {
    if (!isBrowser) return null;
    
    const cacheKey = `${path}/${id}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    try {
      const docRef = doc(db, path, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as T;
        cache.set(cacheKey, { data, timestamp: Date.now(), ttl: CACHE_TTL });
        return data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching document ${path}/${id}:`, error);
      return null;
    }
  },

  // Get a collection with caching
  async getCollection<T>(path: string, constraints: any[] = []): Promise<T[]> {
    if (!isBrowser) return [];
    
    const cacheKey = `${path}:${JSON.stringify(constraints)}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T[];
    }

    try {
      let q: any = collection(db, path);
      
      // Apply constraints
      constraints.forEach(({ type, field, operator, value }) => {
        switch (type) {
          case 'where':
            q = query(q, where(field, operator, value));
            break;
          case 'orderBy':
            q = query(q, orderBy(field, value));
            break;
          case 'limit':
            q = query(q, limit(value));
            break;
        }
      });

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as Record<string, any>)
      })) as T[];
      
      cache.set(cacheKey, { data, timestamp: Date.now(), ttl: CACHE_TTL });
      return data;
    } catch (error) {
      console.error(`Error fetching collection ${path}:`, error);
      return [];
    }
  },

  // Subscribe to real-time updates
  subscribe<T>(path: string, callback: (data: T[]) => void, constraints: any[] = []): (() => void) | null {
    if (!isBrowser) return null;
    
    try {
      let q: any = collection(db, path);
      
      // Apply constraints
      constraints.forEach(({ type, field, operator, value }) => {
        switch (type) {
          case 'where':
            q = query(q, where(field, operator, value));
            break;
          case 'orderBy':
            q = query(q, orderBy(field, value));
            break;
          case 'limit':
            q = query(q, limit(value));
            break;
        }
      });

      const unsubscribe = onSnapshot(q, (snapshot: any) => {
        const data = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as Record<string, any>)
        })) as T[];
        callback(data);
      }, (error) => {
        console.error(`Error in subscription for ${path}:`, error);
      });

      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up subscription for ${path}:`, error);
      return null;
    }
  },

  // Clear cache
  clearCache(path?: string): void {
    if (path) {
      // Clear specific path
      for (const key of cache.keys()) {
        if (key.startsWith(path)) {
          cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      cache.clear();
    }
  },

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: cache.size,
      keys: Array.from(cache.keys())
    };
  }
};

export { optimizedQueries }; 