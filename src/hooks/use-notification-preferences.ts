
// src/hooks/use-notification-preferences.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db, analytics } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';

export type NotificationFrequency = 'off' | 'once' | 'twice' | 'thrice';

const PREFERENCES_KEY_LOCALSTORAGE = 'dailyGraceNotificationPreferences_local';

interface NotificationPreferences {
  frequency: NotificationFrequency;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({ frequency: 'once' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getPreferencesDocRef = useCallback(() => {
    if (!user) return null;
    // Store preferences in a subcollection or a specific document field
    return doc(db, 'users', user.uid, 'preferences', 'notifications');
  }, [user]);

  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoaded(false);
      if (user) {
        const docRef = getPreferencesDocRef();
        if (!docRef) {
          setIsLoaded(true); // Should not happen if user is defined, but guard
          return;
        }
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setPreferences(docSnap.data() as NotificationPreferences);
          } else {
            // Default preferences for a new user or if no doc exists
            setPreferences({ frequency: 'once' });
          }
        } catch (error) {
          console.error("Failed to load notification preferences from Firestore:", error);
          setPreferences({ frequency: 'once' }); // Reset to default on error
        }
      } else {
        if (typeof window !== 'undefined') {
          const storedPrefs = localStorage.getItem(PREFERENCES_KEY_LOCALSTORAGE);
          if (storedPrefs) {
            try {
              setPreferences(JSON.parse(storedPrefs));
            } catch (error) {
              console.error("Failed to parse notification preferences from localStorage:", error);
              setPreferences({ frequency: 'once' });
            }
          } else {
            setPreferences({ frequency: 'once' });
          }
        }
      }
      setIsLoaded(true);
    };

    loadPreferences();
  }, [user, getPreferencesDocRef]);

  const updateFrequency = useCallback(async (newFrequency: NotificationFrequency) => {
    setIsSaving(true);
    const newPrefs = { ...preferences, frequency: newFrequency };
    setPreferences(newPrefs); // Optimistic update

    if (analytics) {
      logEvent(analytics, 'notification_frequency_changed', {
        new_frequency: newFrequency,
        user_status: user ? 'logged_in' : 'logged_out',
      });
    }

    if (user) {
      const docRef = getPreferencesDocRef();
      if (!docRef) {
        setIsSaving(false);
        return; // Should not happen
      }
      try {
        // Use setDoc with merge:true to create the document/subcollection if it doesn't exist
        await setDoc(docRef, { frequency: newFrequency }, { merge: true });
      } catch (error) {
        console.error("Failed to update notification frequency in Firestore:", error);
        // Revert optimistic update (or show error toast)
        // For simplicity, current preferences state holds the optimistic update.
        // A more robust solution might involve reverting or using the previous state.
        if (analytics) {
          logEvent(analytics, 'notification_frequency_change_failed', {
            attempted_frequency: newFrequency,
            error_message: (error as Error).message,
          });
        }
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem(PREFERENCES_KEY_LOCALSTORAGE, JSON.stringify(newPrefs));
      }
    }
    setIsSaving(false);
  }, [preferences, user, getPreferencesDocRef]);

  return { preferences, updateFrequency, isLoaded, isSaving };
}
