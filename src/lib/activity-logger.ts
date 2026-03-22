'use client';

import { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityType, AdminConfig } from '@/lib/types';

// Store the config in memory to reduce database reads
let logConfig: AdminConfig['activityLogConfig'] | null = null;
let lastFetched: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the admin config if the cache is stale.
 * @param supabase The Supabase client instance.
 */
async function ensureConfigIsLoaded(supabase: SupabaseClient) {
    const now = Date.now();
    if (logConfig && lastFetched && (now - lastFetched < CACHE_DURATION_MS)) {
        return;
    }

    try {
        const { data: configData, error } = await supabase
            .from('admin_config')
            .select('activity_log_config')
            .eq('config_key', 'singleton')
            .maybeSingle();
        
        if (error) throw error;
        
        if (configData) {
            logConfig = configData.activity_log_config || {};
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
 * Logs a user activity to the 'activity_logs' table in Supabase,
 * only if the activity type is enabled in the global admin configuration.
 *
 * @param supabase The Supabase client instance.
 * @param userId The UID of the user performing the action.
 * @param activityType The type of activity being logged.
 * @param data An object containing contextual data about the event.
 */
export async function logActivity(
    supabase: SupabaseClient,
    userId: string,
    activityType: ActivityType,
    data: object = {}
) {
    if (!supabase || !userId) {
        console.warn("Activity Logger: Supabase client or User ID not available. Skipping log.");
        return;
    }

    // Ensure the latest config is loaded (from cache if possible)
    await ensureConfigIsLoaded(supabase);

    // Check if the specific activity type is enabled before logging
    if (!logConfig || !logConfig[activityType]) {
        return; // Silently do nothing if logging is disabled for this activity
    }

    try {
        const logData = {
            user_id: userId,
            activity_type: activityType,
            data,
            created_at: new Date().toISOString(),
        };
        
        // Fire and forget - don't wait for response
        supabase
            .from('activity_logs')
            .insert(logData)
            .then(({ error }) => {
                if (error) {
                    console.error(`Failed to log activity of type '${activityType}':`, error);
                }
            });
    } catch (error) {
        // Log to console for debugging, but don't let it crash the app.
        console.error(`Failed to log activity of type '${activityType}':`, error);
    }
}
