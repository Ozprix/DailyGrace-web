
# Daily Grace - Web Application

Welcome to Daily Grace, your daily dose of inspiration and spiritual upliftment. This web application provides users with AI-generated devotionals, spiritual challenges, journaling capabilities, and more, with a focus on community and growth.

It is also configured as a Progressive Web App (PWA), allowing users to install it to their home screen on supported devices for a more app-like experience and potential offline capabilities.

![Daily Grace App Screenshot](https://placehold.co/800x450.png)

## 🚀 Quick Start (TL;DR)

1.  **Firebase Project**: Create a Firebase project and enable Authentication, Firestore, and App Hosting.
2.  **Environment Setup**: Copy `.env.example` to `.env` and fill in your Firebase project keys for local development.
3.  **Install & Run**: Run `npm install` to get dependencies.
4.  **Run Dev Server**: Start the app with `npm run dev`.
5.  **Seed Data**: Populate your Firestore database by running the `seed-firestore.js` script.

---

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI Components, Tailwind CSS
*   **AI Functionality:** Genkit (Google AI Gemini models)
*   **Backend & Database:** Firebase (Authentication, Firestore, Cloud Functions, App Hosting)
*   **State Management:** React Context API, Custom Hooks
*   **PWA:** `@ducanh2912/next-pwa`
*   **Payments (Conceptual):** Stripe

## Key Features

*   **User Authentication:** Secure sign-up/login via email/password and Google.
*   **Daily Devotionals & Community Reflections:** AI-generated messages with user reflections.
*   **Spiritual Challenges & Reading Plans:** Guided multi-day journeys with progress tracking.
*   **Weekly Missions & Gamification:** Earn "Grace Points" for completing small tasks.
*   **Grace Store:** Spend points to unlock exclusive content like themes and devotional series.
*   **Referral System:** Invite friends to earn bonus points for both users.
*   **Community Features:** Anonymous Prayer Wall and private Prayer Circles.
*   **AI-Powered Features:** Custom devotional generation and Grace Companion AI Chat.
*   **Progressive Web App (PWA):** Installable with offline capabilities.

---

## ☁️ Deployment Guide

This application is configured for deployment on **Firebase App Hosting**.

### 1. Prerequisites
*   Node.js (v18 or later)
*   A Firebase project with the **Blaze (Pay-as-you-go)** plan enabled. App Hosting requires this.
*   [Firebase CLI](https://firebase.google.com/docs/cli) installed and authenticated (`npm install -g firebase-tools` and `firebase login`).

### 2. Firebase Project Setup
*   **Enable APIs**: In your Google Cloud project (linked to your Firebase project), ensure the following APIs are enabled:
    *   App Hosting API (`apphosting.googleapis.com`)
    *   Cloud Build API (`cloudbuild.googleapis.com`)
    *   Secret Manager API (`secretmanager.googleapis.com`)
*   **Enable Firebase Services**: In the Firebase Console, enable:
    *   **Authentication** (with Email/Password and Google providers)
    *   **Firestore** (in Native mode)

### 3. Production Environment Variables (Secrets)
For security, server-side keys **must not** be deployed in your code. You will use Google's Secret Manager, which App Hosting integrates with.

*   Open the [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager) for your project.
*   Create secrets with the following **exact names**:
    *   `GOOGLE_API_KEY`: Set its value to your Google AI API key.
    *   `STRIPE_SECRET_KEY`: Set its value to your Stripe secret key (if you plan to use it).
*   Grant the **Cloud Build service account** access to these secrets. Find the service account email in Google Cloud IAM (it looks like `[project-number]@cloudbuild.gserviceaccount.com`) and give it the "Secret Manager Secret Accessor" role.

### 4. Deploy Your App
From your project's root directory, run the following command:

```bash
firebase deploy --only hosting
```

The Firebase CLI will build your Next.js application and deploy it to App Hosting. After it finishes, it will provide you with your live URL!

---

## 🧪 Testing

This project uses **Jest** for unit testing. Test files are located alongside the source files they are testing. You can run the entire test suite using `npm run test`.

## 🤝 Contributing

Contributions are welcome! If you have a suggestion or want to contribute code, please feel free to open a pull request or an issue.
