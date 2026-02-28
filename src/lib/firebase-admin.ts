// This file should only be imported on the server.
import * as admin from 'firebase-admin';

/**
 * Return an initialized admin.App. Idempotent.
 * This version relies on Application Default Credentials, which is the standard
 * for deployed Google Cloud environments like Cloud Functions or App Engine.
 * No service account key file is needed.
 */
export function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  // When deployed, Firebase automatically provides the necessary configuration.
  // When running locally, the Firebase CLI (via `firebase emulators:start` or `firebase serve`)
  // sets up the GOOGLE_APPLICATION_CREDENTIALS environment variable.
  return admin.initializeApp();
}
