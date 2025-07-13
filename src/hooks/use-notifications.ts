
// src/hooks/use-notifications.ts
"use client";

import { useState, useEffect } from 'react';
import { getToken, isSupported as isMessagingSupported } from 'firebase/messaging';
import { messaging, db, analytics } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(typeof window !== 'undefined' ? Notification.permission : 'default');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      isMessagingSupported().then(setIsSupported);
      const interval = setInterval(() => {
        if (Notification.permission !== permissionStatus) {
          setPermissionStatus(Notification.permission);
           if (analytics) {
            logEvent(analytics, 'notification_permission_status_changed_externally', {
              new_status: Notification.permission,
              previous_status: permissionStatus,
            });
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [permissionStatus]);

  const requestPermissionAndToken = async () => {
    if (analytics) {
      logEvent(analytics, 'notification_permission_request_initiated');
    }

    if (!VAPID_KEY) {
      console.error("VAPID key is not set in .env. NEXT_PUBLIC_FIREBASE_VAPID_KEY");
      toast({
        title: "Configuration Error",
        description: "Notification VAPID key is missing. Please contact support.",
        variant: "destructive",
      });
      setIsProcessing(false);
      if (analytics) {
        logEvent(analytics, 'notification_setup_error', { error_type: 'missing_vapid_key' });
      }
      return null;
    }

    if (!isSupported || !messaging) {
        console.warn('Firebase Messaging is not supported in this browser or not initialized.');
        toast({
          title: 'Notifications Not Supported',
          description: 'Push notifications are not available in this browser or not configured.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        if (analytics) {
          logEvent(analytics, 'notification_setup_error', { error_type: 'messaging_not_supported_or_initialized' });
        }
        return null;
    }

    setIsProcessing(true);
    try {
      const currentPermission = Notification.permission;
      setPermissionStatus(currentPermission);

      if (currentPermission === 'granted') {
        toast({ title: 'Notifications already enabled!' });
        if (analytics) {
          logEvent(analytics, 'notification_permission_status', { status: 'already_granted' });
        }
        return await getAndStoreToken();
      }

      if (currentPermission === 'denied') {
        toast({
          title: 'Notification Permission Denied',
          description: 'Please enable notifications in your browser settings and try again.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        if (analytics) {
          logEvent(analytics, 'notification_permission_status', { status: 'already_denied' });
        }
        return null;
      }

      const permissionResult = await Notification.requestPermission();
      setPermissionStatus(permissionResult);

      if (analytics) {
        logEvent(analytics, 'notification_permission_status', { status: permissionResult });
      }

      if (permissionResult === 'granted') {
        toast({ title: 'Notification Permission Granted!' });
        return await getAndStoreToken();
      } else {
        toast({
          title: 'Permission Not Granted',
          description: 'You chose not to receive notifications.',
        });
        setIsProcessing(false);
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission or getting token:', error);
      toast({
        title: 'Error Setting Up Notifications',
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      if (analytics) {
        logEvent(analytics, 'notification_permission_error', { error_message: (error as Error).message });
      }
    } finally {
      setIsProcessing(false);
    }
    return null;
  };

  const getAndStoreToken = async () => {
    if (!messaging || !VAPID_KEY) {
        console.error("Firebase Messaging is not initialized or VAPID key missing.");
        setIsProcessing(false);
        if (analytics) {
          logEvent(analytics, 'fcm_token_error', { error_type: 'messaging_not_initialized_or_vapid_missing' });
        }
        return null;
    }
    setIsProcessing(true);
    try {
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        toast({ title: 'Notifications Active!', description: 'You are set to receive notifications.' });
        if (analytics) {
          logEvent(analytics, 'fcm_token_obtained');
        }
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, { fcmTokens: arrayUnion(currentToken) }, { merge: true });
          console.log('FCM Token stored for user:', user.uid);
          if (analytics) {
            logEvent(analytics, 'fcm_token_stored_firestore');
          }
        } else {
           if (analytics) {
            logEvent(analytics, 'fcm_token_obtained_anonymous_user');
          }
        }
        return currentToken;
      } else {
        console.warn('No registration token available. Request permission to generate one.');
        toast({
          title: 'Could Not Get Notification Token',
          description: 'Please try enabling notifications again.',
          variant: 'destructive',
        });
        if (analytics) {
          logEvent(analytics, 'fcm_token_error', { error_type: 'no_registration_token' });
        }
      }
    } catch (error) {
      console.error('Error getting or storing FCM token:', error);
      toast({
        title: 'Error Activating Notifications',
        description: (error as Error).message || 'Failed to get notification token.',
        variant: 'destructive',
      });
       if (analytics) {
        logEvent(analytics, 'fcm_token_error', { error_type: 'get_or_store_failed', error_message: (error as Error).message });
      }
    } finally {
      setIsProcessing(false);
    }
    return null;
  };

  return { requestPermissionAndToken, permissionStatus, isProcessing, isSupported };
}
