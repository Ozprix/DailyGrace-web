
// public/firebase-messaging-sw.js

// These scripts are imported by the service worker.
// Ensure versions are compatible with your main Firebase SDK version.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ** IMPORTANT **
// Replace these with your actual Firebase project configuration values.
// These are the same values you use in your main app's Firebase initialization (from your .env or Firebase console).
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID", // This is crucial for FCM
  appId: "YOUR_FIREBASE_APP_ID",
  measurementId: "YOUR_FIREBASE_MEASUREMENT_ID" // Optional but good for consistency
};

// Initialize Firebase
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here from the data received
  // The payload structure might depend on how you send the notification from your backend.
  // Example assumes payload.data or payload.notification contains title, body, icon.
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Daily Grace';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Your daily devotional is ready.',
    icon: payload.notification?.icon || payload.data?.icon || '/app-logo-192.png', // Ensure you have an icon at public/app-logo-192.png
    // badge: '/badge-icon.png', // Optional: for Android on some devices
    // tag: 'daily-grace-devotional', // Optional: to replace old notifications with the same tag
    // renotify: true, // Optional: to make sound/vibrate even if an old notification with same tag exists
    // data: { url: payload.data?.url || '/' } // Optional: custom data to use on notification click
  };

  // self.registration.showNotification is the standard API to display a notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification);
  event.notification.close(); // Close the notification

  // Example: Open a specific URL or the app's root page
  const targetUrl = event.notification.data?.url || '/';

  // This looks to see if the current tab is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // If a window with the target URL is already open, focus it.
        // You might need to adjust URL matching logic based on your app's routing.
        if (client.url === self.location.origin + targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open or no matching window is found, open a new one.
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
