// functions/src/handlers/referralHandler.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

const db = admin.firestore();

const REFERRAL_BONUS = 100;

export const processReferral = functions.https.onCall(async (data, context) => {
    // 1. Validate inputs
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const referrerId = data.referrerId;
    if (typeof referrerId !== 'string' || referrerId.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid "referrerId".');
    }

    const newUserUid = context.auth.uid;
    
    // Can't refer yourself
    if (newUserUid === referrerId) {
         throw new functions.https.HttpsError('invalid-argument', 'You cannot refer yourself.');
    }

    // 2. Security Check: ensure user is new
    const userRecord = await admin.auth().getUser(newUserUid);
    const creationTime = new Date(userRecord.metadata.creationTime);
    const now = new Date();
    const ageInMinutes = (now.getTime() - creationTime.getTime()) / 1000 / 60;
    
    if (ageInMinutes > 5) { // User must be created within the last 5 minutes
        throw new functions.https.HttpsError('permission-denied', 'This user is not new and cannot claim a referral.');
    }
    
    // 3. Check if referrer exists
    const referrerPrefsRef = db.collection('user_preferences').doc(referrerId);
    
    // 4. Check if new user has already been referred
    const newUserPrefsRef = db.collection('user_preferences').doc(newUserUid);

    // 5. Use a transaction to award points
    try {
        await db.runTransaction(async (transaction) => {
            const referrerDoc = await transaction.get(referrerPrefsRef);
            if (!referrerDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'The specified referrer does not exist.');
            }

            const newUserDoc = await transaction.get(newUserPrefsRef);
            if (newUserDoc.exists && newUserDoc.data()?.referredBy) {
                // This prevents double-claiming but allows the function to complete gracefully without error if called multiple times.
                logger.info(`User ${newUserUid} has already been referred by ${newUserDoc.data()?.referredBy}. No action taken.`);
                return;
            }

            // Award points to the new user
            transaction.set(newUserPrefsRef, {
                totalPoints: admin.firestore.FieldValue.increment(REFERRAL_BONUS),
                referredBy: referrerId,
                // also set default preferences on creation
                frequency: 'once',
                contentStyle: 'detailed',
                enableChallengeReminders: true,
                enableWeeklyDigest: false,
                subscriptionStatus: 'free',
                unlockedExclusiveSeriesIds: [],
                unlockedThemeIds: [],
                activeCustomThemeId: null,
                currentStreak: 0,
                lastStreakDate: null,
                longestStreak: 0,
                verseOfTheDayId: 'john316',
                onboardingCompleted: false,
                lastChallengeCompletedAt: null,
                dailyContentLastUpdated: null,
            }, { merge: true });

            // Award points to the referrer
            transaction.update(referrerPrefsRef, {
                totalPoints: admin.firestore.FieldValue.increment(REFERRAL_BONUS)
            });
        });
        
        logger.info(`Referral success: ${referrerId} referred ${newUserUid}.`);
        return { success: true, message: `Successfully awarded ${REFERRAL_BONUS} points to both users.` };

    } catch (error) {
        logger.error(`Referral transaction failed for referrer ${referrerId} and new user ${newUserUid}`, error as Error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to process referral due to a server error.');
    }
});
