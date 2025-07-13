
// Create this file if it doesn't exist, or add the domain to your existing config.
// This is a placeholder for your application's configuration.

import * as functions from 'firebase-functions';

interface AppConfig {
  domain: string;
  // Add other app-specific configurations here
}

// Attempt to get from Firebase functions config, otherwise use a default/placeholder
const getConfiguredDomain = (): string => {
  try {
    const cfg = functions.config();
    if (cfg.app && cfg.app.url) {
      return cfg.app.url;
    }
  } catch (e) {
    // functions.config() can only be used in a functions environment.
    // For local development or if not set, use a placeholder.
    // This catch block might not be hit if functions.config() itself doesn't throw but returns an empty object.
    console.warn("Error accessing functions.config() or app.url not set. Details:", e);
  }

  // For deployed functions (NODE_ENV is usually 'production'), app.url MUST be set.
  // process.env.FUNCTIONS_EMULATOR is 'true' when running in the local emulator.
  if (process.env.NODE_ENV === 'production' && !process.env.FUNCTIONS_EMULATOR) {
    // Check again, specifically for the case where cfg.app or cfg.app.url was undefined but no error was caught
    const cfg = functions.config(); // Re-check in case the first try was too early or in a different context
    if (cfg.app && cfg.app.url) {
        return cfg.app.url;
    }
    // If still not found in a production-like environment (deployment), it's a critical configuration error.
    throw new Error("CRITICAL: functions.config().app.url is not set in the Firebase environment configuration. Run 'firebase functions:config:set app.url=\"https://your-app-domain.com\"'");
  }
  
  // Fallback for local development or when FUNCS_EMULATOR is true
  return 'http://localhost:9002'; // Default for local Next.js dev server
};


export const appConfig: AppConfig = {
  domain: getConfiguredDomain(),
  // other configurations
};
