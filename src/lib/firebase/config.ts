// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
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
};

// Conditionally add optional configuration values if they are set and non-empty
if (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID && process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID.trim() !== '') {
  coreFirebaseConfig.messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
}

if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID.trim() !== '') {
  coreFirebaseConfig.measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
}

const firebaseConfig = coreFirebaseConfig;

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);

let messaging: Messaging | null = null;
if (typeof window !== 'undefined' && firebaseConfig.messagingSenderId) {
  try {
    // Firebase Messaging can only be initialized in a browser environment
    // and requires messagingSenderId in the config.
    messaging = getMessaging(app);
  } catch (e) {
    console.warn("Firebase Messaging is not supported in this environment or failed to initialize:", e);
  }
}


let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized");
    } else {
      console.log("Firebase Analytics is not supported in this browser.");
    }
  }).catch(e => {
    console.warn("Error checking Firebase Analytics support:", e);
  });
}

export { app, auth, db, messaging, analytics, storage };
