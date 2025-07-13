// src/functions/src/handlers/emailDigestHandler.ts
import * as functions from 'firebase-functions';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';

// This function can be scheduled to run weekly.
// Target type: Pub/Sub, Topic: 'weekly-email-digest-tick'
export const sendWeeklyEmailDigest = functions.pubsub
  .topic('weekly-email-digest-tick')
  .onPublish(async (message) => {
    logger.info('Weekly email digest function triggered.');
    
    try {
      const result = await emailService.sendWeeklyDigests();
      logger.info('Email digest process completed.', result);
    } catch (error) {
      logger.error('An unhandled error occurred in the email digest scheduler.', error as Error);
    }
  });
