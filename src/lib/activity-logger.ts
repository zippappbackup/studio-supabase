
'use client';

import { collection, serverTimestamp, doc, getDoc, Firestore } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { ActivityType, AdminConfig } from '@/lib/types';

// Store the config in memory to reduce Firestore reads
let logConfig: AdminConfig['activityLogConfig'] | null = null;
let lastFetched: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the admin config if the cache is stale.
 * @param db The Firestore instance.
 */
async function ensureConfigIsLoaded(db: Firestore) {
    const now = Date.now();
    if (logConfig && lastFetched && (now - lastFetched < CACHE_DURATION_MS)) {
        return;
    }

    try {
        const configRef = doc(db, 'adminConfig', 'global');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
            const configData = configSnap.data() as AdminConfig;
            logConfig = configData.activityLogConfig || {};
            lastFetched = now;
        } else {
            // If no config doc, assume all logging is off
            logConfig = {};
        }
    } catch (error) {
        console.error("Activity Logger: Could not fetch remote config. Disabling logging.", error);
        logConfig = {}; // Disable logging on error
    }
}

/**
 * Logs a user activity to the 'userActivityLogs' collection in Firestore,
 * only if the activity type is enabled in the global admin configuration.
 *
 * @param db The Firestore instance.
 * @param userId The UID of the user performing the action.
 * @param activityType The type of activity being logged.
 * @param data An object containing contextual data about the event.
 */
export async function logActivity(
    db: Firestore,
    userId: string,
    activityType: ActivityType,
    data: object = {}
) {
    if (!db || !userId) {
        console.warn("Activity Logger: Firestore or User ID not available. Skipping log.");
        return;
    }

    // Ensure the latest config is loaded (from cache if possible)
    await ensureConfigIsLoaded(db);

    // Check if the specific activity type is enabled before logging
    if (!logConfig || !logConfig[activityType]) {
        return; // Silently do nothing if logging is disabled for this activity
    }

    try {
        const logData = {
            userId,
            activityType,
            data,
            createdAt: serverTimestamp(),
        };
        const logCollectionRef = collection(db, 'userActivityLogs');
        // This is a non-blocking "fire and forget" operation
        addDocumentNonBlocking(logCollectionRef, logData);
    } catch (error) {
        // Log to console for debugging, but don't let it crash the app.
        console.error(`Failed to log activity of type '${activityType}':`, error);
    }
}

    