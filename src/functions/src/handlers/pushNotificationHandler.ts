// src/functions/src/handlers/pushNotificationHandler.ts
import * as functions from 'firebase-functions';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

// This function can be scheduled to run daily using Google Cloud Scheduler.
// Target type: Pub/Sub, Topic: 'daily-devotional-tick' (or any name you configure)
export const sendDailyDevotionalNotification = functions.pubsub
  .topic('daily-devotional-tick')
  .onPublish(async (message) => {
    logger.info('Daily devotional notification function triggered.');
    
    try {
      const result = await notificationService.sendDailyDevotionalNotifications();
      logger.info('Notification sending process completed.', result);
    } catch (error) {
      logger.error('An unhandled error occurred in the notification scheduler.', error as Error);
    }
  });
