// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getMessaging, type Messaging } from 'firebase/messaging';
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getStorage } from 'firebase/storage';

// Build the core Firebase config object
const coreFirebaseConfig: { [key: string]: string | undefined } = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize Firebase only in browser environment or if we have valid config
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let messaging: Messaging;
let analytics: Analytics | null = null;
let storage: any;

if (isBrowser && coreFirebaseConfig.apiKey) {
  try {
    // Initialize Firebase app
    app = getApps().length === 0 ? initializeApp(coreFirebaseConfig) : getApp();
    
    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Initialize messaging only if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.warn('Messaging not supported:', error);
      }
    }
    
    // Initialize analytics only if supported and in browser
    if (isBrowser) {
      isAnalyticsSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {
        // Analytics not supported
      });
    }
    
    // Connect to emulators in development
    if (process.env.NODE_ENV === 'development') {
      try {
        if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
          connectAuthEmulator(auth, 'http://localhost:9099');
          connectFirestoreEmulator(db, 'localhost', 8080);
        }
      } catch (error) {
        console.warn('Failed to connect to emulators:', error);
      }
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    // Create fallback objects to prevent crashes
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    messaging = {} as Messaging;
    storage = {};
  }
} else {
  // Create fallback objects for server-side rendering
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  messaging = {} as Messaging;
  storage = {};
}

export { app, auth, db, messaging, analytics, storage };
