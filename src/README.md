
# Daily Grace - Web Application

Welcome to Daily Grace, your daily dose of inspiration and spiritual upliftment. This web application provides users with AI-generated devotionals, spiritual challenges, journaling capabilities, and more, with a focus on community and growth.

It is also configured as a Progressive Web App (PWA), allowing users to install it to their home screen on supported devices for a more app-like experience and potential offline capabilities.

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI Components, Tailwind CSS
*   **AI Functionality:** Genkit (Google AI Gemini models)
*   **Backend & Database:** Firebase (Authentication, Firestore, Cloud Functions, Cloud Messaging)
*   **State Management:** React Context API, Custom Hooks
*   **PWA:** `@ducanh2912/next-pwa`
*   **Payments (Conceptual):** Stripe

## Key Features

*   **User Authentication:** Secure sign-up/login via email/password and Google.
*   **Daily Devotionals:**
    *   AI-generated inspirational messages based on a daily Bible verse.
    *   Community reflections for users to share their thoughts on the daily verse.
    *   Shuffle for a new verse and devotional.
    *   Share devotional content via social media or link.
*   **Custom Devotional Generation:** Users can enter any Bible verse to generate a unique devotional on-demand.
*   **Spiritual Challenges:**
    *   Curated multi-day journeys (e.g., "20-Day Prayer Journey", "10-Day Peace Pursuit").
    *   Progress tracking (start, mark days complete, view overall progress).
*   **Reading Plans:** Follow structured plans to journey through Scripture, including full books like the Gospel of John.
*   **User Journaling:**
    *   Write and save personal reflections for any devotional, complete with mood and tag tracking.
    *   "My Journal" page to view and filter all past entries.
*   **Grace Points & Store:**
    *   Earn points for engaging activities like completing challenges, missions, and quizzes.
    *   Spend points in the "Grace Store" to unlock exclusive devotional series and custom app themes.
*   **Community Features:**
    *   **Prayer Wall:** An anonymous space for users to post prayer requests and pray for others.
    *   **Prayer Circles:** Create or join private, invite-only groups for sharing and prayer.
    *   **Community Reflections:** Share and upvote thoughts on the daily devotional verse.
*   **Gamification & Progress:**
    *   **Weekly Missions:** Bite-sized, achievable weekly tasks to encourage regular engagement and earn points.
    *   **Achievements & Streaks:** Earn badges for milestones and maintain a daily activity streak.
    *   **Progress Dashboard:** A "Year in Review" style page visualizing user activity over time.
*   **User Profile & Settings:**
    *   Update display name and password.
    *   Configure notification and content preferences.
*   **Referral System:** Invite friends to the app, and both users receive bonus Grace Points upon signup.
*   **Grace Companion AI Chat:** Interactive AI chat for spiritual guidance, Bible verse lookup, and general encouragement.
*   **Quizzes:** Test your knowledge with various quiz categories (Bible Trivia, Personality, etc.) and earn points.
*   **Progressive Web App (PWA):** Installable to the user's home screen with offline capabilities for synced content.


## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   A Firebase project
*   [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)

### Firebase Setup

1.  Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
2.  **Enable Firebase Services:**
    *   **Authentication:** Enable Email/Password and Google sign-in methods.
    *   **Firestore:** Create a Firestore database in **Native mode**. Choose a region.
    *   **Cloud Messaging (FCM):** Required for push notifications. Ensure you have a "Web push certificate" (VAPID key pair) generated in Firebase Project Settings > Cloud Messaging.
    *   **Cloud Functions:** Will be used for the push notification delivery system and referral processing.
3.  **Register your Web App:**
    *   In your Firebase project settings, add a new Web app.
    *   Copy the Firebase configuration object provided.

### Environment Variables

1.  Create a `.env` file in the root of the project (this file is gitignored).
2.  Add your Firebase project configuration details and other necessary keys.

    **For the Next.js Frontend (Client-side accessible):**
    ```env
    # Firebase Project Configuration (from Firebase Console)
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id # Optional, for Analytics
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    ```

    **For the Genkit AI Backend Server (Server-side only, NOT prefixed with `NEXT_PUBLIC_`):**
    ```env
    # Genkit/Google AI (Gemini)
    GOOGLE_API_KEY=your_google_ai_api_key
    ```

### Installation

```bash
npm install
# or
yarn install
```

### Running the Development Server

The application requires two development servers to run concurrently for full functionality:

1.  **Next.js Frontend Server:**
    This server runs the main web application and its integrated AI flows.
    ```bash
    npm run dev
    ```
    This will typically start the web app on `http://localhost:9002`.

2.  **Firebase Functions & Firestore Emulator:**
    This emulates the backend services needed for features like push notifications and referral processing.
    Open a second terminal window/tab and run:
    ```bash
    npm run firebase:emulators
    ```
    This starts the local Firebase emulator suite.

### Firestore Data Seeding (CRITICAL STEP)

The application relies on initial data in Firestore for Bible verses, challenges, reading plans, quizzes, and store items. A seeder script is provided to populate your database.

1.  **Service Account Key:**
    *   Go to your Firebase Project Settings -> Service accounts.
    *   Click "Generate new private key" and download the JSON file.
    *   Rename this file to `serviceAccountKey.json` and place it inside the `src/firestore-seeder` directory.
    *   **Important:** This file contains sensitive credentials. Ensure it is **never committed to Git**. The `.gitignore` file is already configured to ignore this file.

2.  **Run the Seeder Script:**
    After setting up your `serviceAccountKey.json`, run the script from your project's root directory to populate your **live Firestore database**.
    ```bash
    cd src/firestore-seeder
    node seed-firestore.js
    cd ../..
    ```
    **You must run this script for the app's content (challenges, quizzes, etc.) to appear.**

### Deployment

This application is configured for deployment on **Firebase App Hosting**. Follow the detailed instructions in the root `README.md` file to deploy your application.

Good luck, and please reach out if you have any questions!
