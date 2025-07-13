// src/functions/src/services/email.service.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import type { UserPreferences } from '../types';
import { subDays } from 'date-fns';

const db = admin.firestore();

export class EmailService {
  private async getUsersForDigest(): Promise<{ userId: string; userPrefs: UserPreferences }[]> {
    const prefsQuery = db.collection('user_preferences').where('enableWeeklyDigest', '==', true);
    const snapshot = await prefsQuery.get();
    if (snapshot.empty) {
      functions.logger.info('No users have opted-in for the weekly email digest.');
      return [];
    }
    return snapshot.docs.map(doc => ({
      userId: doc.id,
      userPrefs: doc.data() as UserPreferences,
    }));
  }

  private async getWeeklyStats(userId: string): Promise<any> {
    const oneWeekAgo = admin.firestore.Timestamp.fromDate(subDays(new Date(), 7));
    let journalCount = 0;
    let challengesCompletedCount = 0;
    
    try {
        const journalQuery = db.collection('users').doc(userId).collection('journal')
        .where('lastSaved', '>=', oneWeekAgo);
        const journalSnapshot = await journalQuery.get();
        journalCount = journalSnapshot.size;
    } catch (e) {
        functions.logger.warn(`Could not query journals for user ${userId}. Maybe index is missing?`, e);
    }

    try {
        const challengesQuery = db.collection('users').doc(userId).collection('userChallengeData')
        .where('status', '==', 'completed')
        .where('completedAt', '>=', oneWeekAgo);
        const challengesSnapshot = await challengesQuery.get();
        challengesCompletedCount = challengesSnapshot.size;
    } catch (e) {
        functions.logger.warn(`Could not query challenges for user ${userId}. Maybe index is missing?`, e);
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const userName = userDoc.data()?.displayName || 'Friend';
    
    return {
      userName,
      journalCount,
      challengesCompletedCount,
    };
  }

  private compileDigestEmail(userName: string, stats: any): string {
    return `
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #4F80F0;">Your Weekly Recap from Daily Grace</h1>
          <p>Hi ${userName},</p>
          <p>Here's a look at your spiritual journey over the last week:</p>
          <ul>
            <li><strong>Journal Entries Written:</strong> ${stats.journalCount}</li>
            <li><strong>Challenges Completed:</strong> ${stats.challengesCompletedCount}</li>
          </ul>
          <p>Keep up the great work! We're blessed to be on this journey with you.</p>
          <p>The Daily Grace Team</p>
        </body>
      </html>
    `;
  }

  public async sendWeeklyDigests(): Promise<any> {
    const users = await this.getUsersForDigest();
    if (users.length === 0) {
      return { success: true, message: 'No users to send digests to.' };
    }

    functions.logger.info(`Found ${users.length} users to send weekly digests to.`);
    let sentCount = 0;

    for (const user of users) {
      const stats = await this.getWeeklyStats(user.userId);
      const emailHtml = this.compileDigestEmail(stats.userName, stats);
      
      // In a real app, you would integrate an email service like SendGrid here.
      // For now, we just log the HTML content.
      const mailRef = admin.firestore().collection('mail').doc();
      await mailRef.set({
        to: user.userId, // This assumes user ID is the email or you fetch the email.
        message: {
          subject: 'Your Weekly Grace Recap!',
          html: emailHtml,
        },
      });
      sentCount++;
    }

    return { success: true, message: `Successfully queued ${sentCount} digest(s).` };
  }
}

export const emailService = new EmailService();
