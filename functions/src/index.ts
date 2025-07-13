
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Assuming your main Cloud Functions (e.g., the push notification scheduler)
// are defined and exported from files within the 'handlers' directory.
// Adjust the path and filenames as per your actual structure if different.
// For example, if your push notification handler is in 'handlers/pushNotificationHandler.ts':
export * from './handlers/pushNotificationHandler';
export * from './handlers/emailDigestHandler';
export * from './handlers/referralHandler';
// Add other exports from other handler files if you have more functions to deploy
// e.g., export * from './handlers/stripeWebhookHandler';

// The lines "export * from './utils';" and "export * from './services';"
// were causing errors because 'utils' and 'services' are directories.
// You generally don't export entire utility or service directories this way
// unless they have an 'index.ts' themselves that aggregates exports.
// Instead, your handler functions (like pushNotificationHandler.ts)
// will directly import the specific utilities and services they need.
// For example, in pushNotificationHandler.ts:
// import { someUtility } from '../utils/someUtilFile';
// import { notificationService } from '../services/notification.service';
