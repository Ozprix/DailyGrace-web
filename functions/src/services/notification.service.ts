// functions/src/services/notification.service.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import type { Devotional, UserData, UserPreferences } from '../types';
import { appConfig } from '../config/app.config';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const messaging = admin.messaging();
const db = admin.firestore();

// A simplified map of streak milestones for notifications
const streakMilestones = [
    { count: 7, name: "Weekly Worshipper" },
    { count: 30, name: "Monthly Mentor" },
    { count: 15, name: "Faithful Fifteen" },
  ];

// Helper to get the day of the year (1-366)
const getDayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export class NotificationService {
  private async getDailyDevotional(): Promise<Devotional | null> {
    const versesCollection = db.collection('bible_verses');
    const allVersesSnap = await versesCollection.orderBy('id').get();
    if (allVersesSnap.empty) {
        functions.logger.error("No verses found in 'bible_verses' collection.");
        return null;
    }
    const allVerses = allVersesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    const dayOfYear = getDayOfYear();
    const verseIndex = dayOfYear % allVerses.length;
    const dailyVerse = allVerses[verseIndex];

    if (!dailyVerse) {
        functions.logger.error("Could not determine daily verse.");
        return null;
    }

    // For notifications, we can use a simpler message.
    return {
      verse: {
        id: dailyVerse.id,
        reference: dailyVerse.reference,
        text: dailyVerse.text,
      },
      message: 'Tap to read your full inspirational message for today.',
      prayerPoint: 'Start your day with a moment of prayer.',
      themes: dailyVerse.tags || [],
      // A generic image URL for notifications
      imageUrl: `${appConfig.domain}/images/notification-banner.png`,
    };
  }

  private async getUsersForNotifications(): Promise<{ userId: string; userData: UserData; userPrefs: UserPreferences }[]> {
    const usersToNotify: { userId:string; userData: UserData; userPrefs: UserPreferences }[] = [];
    
    // Query for all user preference documents where frequency is not 'off'
    const preferencesQuery = db.collection('user_preferences').where('frequency', '!=', 'off');
    const preferencesSnapshot = await preferencesQuery.get();

    if (preferencesSnapshot.empty) {
        functions.logger.info("No users have opted-in for notifications.");
        return [];
    }

    // For each preference doc, get the user's FCM tokens
    for (const prefDoc of preferencesSnapshot.docs) {
        const userId = prefDoc.id;
        const userPrefs = prefDoc.data() as UserPreferences;
        const userDocRef = db.collection('users').doc(userId);
        const userDocSnap = await userDocRef.get();

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            if (userData.fcmTokens && userData.fcmTokens.length > 0) {
                usersToNotify.push({ userId, userData, userPrefs });
            }
        }
    }
    
    functions.logger.info(`Found ${usersToNotify.length} users eligible for notifications.`);
    return usersToNotify;
  }

  private async cleanupStaleTokens(tokensToRemove: { [userId: string]: string[] }): Promise<void> {
    const promises: Promise<any>[] = [];
    for (const userId in tokensToRemove) {
      const tokens = tokensToRemove[userId];
      if (tokens.length > 0) {
        const userDocRef = doc(db, 'users', userId);
        promises.push(userDocRef.update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokens)
        }));
        functions.logger.info(`Queued removal of ${tokens.length} stale tokens for user ${userId}.`);
      }
    }
    await Promise.all(promises);
    functions.logger.info('Stale token cleanup finished.');
  }

  private _buildPersonalizedNotification(userPrefs: UserPreferences, devotional: Devotional): admin.messaging.MessagingPayload {
    const today = new Date();
    const lastStreakDate = userPrefs.lastStreakDate ? new Date(userPrefs.lastStreakDate) : null;
    const currentStreak = userPrefs.currentStreak || 0;

    // 1. Re-engagement notification
    if (lastStreakDate && currentStreak > 0) { // Only send if they had an active streak
        const daysSinceLastActive = Math.round((today.getTime() - lastStreakDate.getTime()) / (1000 * 3600 * 24));
        if (daysSinceLastActive >= 3 && daysSinceLastActive < 7) { // Inactive for 3-6 days
            return {
                notification: {
                    title: "We Miss You at Daily Grace! 🌱",
                    body: "Your spiritual garden needs watering. Come back to continue your journey and find new inspiration."
                },
                webpush: { fcmOptions: { link: `${appConfig.domain}/` } },
                data: { navigateTo: 'home' }
            };
        }
    }
    
    // 2. Upcoming streak milestone notification
    const upcomingMilestone = streakMilestones.find(m => m.count === currentStreak + 1);
    if (upcomingMilestone) {
        return {
            notification: {
                title: `You're so close!`,
                body: `Keep it up! You are just one day away from achieving the "${upcomingMilestone.name}" badge. Don't miss today's devotional!`
            },
            webpush: { fcmOptions: { link: `${appConfig.domain}/daily-devotional` } },
            data: { navigateTo: 'daily-devotional', verseId: devotional.verse.id }
        };
    }

    // 3. Standard daily devotional notification (default)
    return {
        notification: {
            title: `Daily Grace: ${devotional.verse.reference}`,
            body: `${devotional.verse.text.substring(0, 100)}... Read your full reflection.`,
            ...(devotional.imageUrl ? { imageUrl: devotional.imageUrl } : {}),
        },
        webpush: { fcmOptions: { link: `${appConfig.domain}/daily-devotional` } },
        data: { verseId: devotional.verse.id, navigateTo: 'daily-devotional' }
    };
  }

  public async sendDailyDevotionalNotifications(): Promise<any> {
    const devotional = await this.getDailyDevotional();
    if (!devotional) {
      functions.logger.error('Failed to get daily devotional content. Aborting notifications.');
      return { success: false, message: 'Failed to get daily devotional content.' };
    }

    const eligibleUsers = await this.getUsersForNotifications();
    if (eligibleUsers.length === 0) {
      functions.logger.info('No users eligible for notifications today.');
      return { success: true, message: 'No users eligible for notifications today.' };
    }

    let successCount = 0;
    let failureCount = 0;
    const tokensToRemove: { [userId: string]: string[] } = {};

    const sendPromises = eligibleUsers.map(async ({ userId, userData, userPrefs }) => {
      const tokens = userData.fcmTokens || [];
      if (tokens.length === 0) return;

      const messagePayload = this._buildPersonalizedNotification(userPrefs, devotional);

      try {
        const response = await messaging.sendToDevice(tokens, messagePayload);
        successCount += response.successCount;
        failureCount += response.failureCount;

        response.results.forEach((result, index) => {
          const error = result.error;
          if (error) {
            functions.logger.error(`Failure sending notification to token for user ${userId}.`, error);
            // Check for stale token error codes
            if (
              error.code === 'messaging/registration-token-not-registered' ||
              error.code === 'messaging/invalid-registration-token'
            ) {
              if (!tokensToRemove[userId]) {
                tokensToRemove[userId] = [];
              }
              const staleToken = tokens[index];
              tokensToRemove[userId].push(staleToken);
              functions.logger.warn(`Identified stale token ${staleToken} for user ${userId}.`);
            }
          }
        });
      } catch (error) {
        functions.logger.error(`Error sending notifications to user ${userId}:`, error);
        failureCount += tokens.length;
      }
    });

    await Promise.all(sendPromises);

    if (Object.keys(tokensToRemove).length > 0) {
        await this.cleanupStaleTokens(tokensToRemove);
    }
    
    functions.logger.info(`Notifications sent: ${successCount} success, ${failureCount} failure.`);
    return { success: true, successCount, failureCount };
  }
}

export const notificationService = new NotificationService();
