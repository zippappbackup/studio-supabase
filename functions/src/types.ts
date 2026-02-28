
import type { Timestamp as FirestoreTimestamp } from "firebase-admin/firestore";

// Using AdminTimestamp for server-side code
export type Timestamp = FirestoreTimestamp;

// Minimal Vendor type definition to satisfy dependencies
export interface Vendor {
  id: string;
  name?: string;
  phone?: string;
  googleSyncLocked?: boolean;
  [key: string]: any; // Allow other properties
}
