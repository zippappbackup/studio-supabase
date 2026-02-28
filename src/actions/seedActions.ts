
"use server";

// IMPORTANT: This file contains functions that perform destructive database operations.
// It is intended for development and testing purposes only.

import * as admin from 'firebase-admin';
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { seedData, mockVendorsAuth } from "@/lib/seed-data";
import { getAdminApp } from '@/lib/firebase-admin';

/**
 * Seeds the database with mock vendor, category, offering, and promotion data.
 */
export async function seedVendors(): Promise<{ success: boolean; count: number, error?: string; }> {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
    
    let batch = db.batch();
    let writeCount = 0;
    const MAX_BATCH_SIZE = 499; // Firestore batch limit is 500

    const commitBatchIfFull = async () => {
      if (writeCount % MAX_BATCH_SIZE === 0 && writeCount > 0) {
        await batch.commit();
        batch = db.batch();
      }
    };

    // Seed Categories
    for (const [id, categoryData] of Object.entries(seedData.categories)) {
        const categoryRef = db.collection("categories").doc(id);
        batch.set(categoryRef, { ...categoryData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        writeCount++;
        await commitBatchIfFull();
    }

    // Seed Vendors
    for (const [id, vendorData] of Object.entries(seedData.vendors)) {
        const vendorRef = db.collection("vendors").doc(id);
        const searchableName = vendorData.name.toLowerCase();
        const searchableTags = vendorData.tags?.map(t => t.toLowerCase()) || [];
        const searchableNameTokens = searchableName.split(/\s+/).filter(Boolean);
        batch.set(vendorRef, { ...vendorData, searchableName, searchableTags, searchableNameTokens, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        writeCount++;
        await commitBatchIfFull();
    }
    
    if (writeCount > 0) {
      await batch.commit();
    }
    
    console.log(`Successfully seeded ${writeCount} documents.`);
    return { success: true, count: writeCount };
  } catch (error) {
    console.error("Error seeding database:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during seeding.";
    return { success: false, count: 0, error: errorMessage };
  }
}

/**
 * Creates Firebase Authentication users for the mock vendors defined in seed-data.ts.
 */
export async function seedMockAuthUsers(): Promise<{ success: boolean; logs: string[], error?: string; }> {
    const logs: string[] = ["Starting to create mock vendor auth users..."];
    try {
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        const db = getFirestore(adminApp);
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

        for (const mockUser of mockVendorsAuth) {
            try {
                let userRecord = await auth.getUserByEmail(mockUser.email).catch(() => null);
                
                if (userRecord) {
                    logs.push(`Auth user for ${mockUser.email} already exists with UID: ${userRecord.uid}.`);
                    if (mockUser.id !== userRecord.uid) {
                        logs.push(`WARNING: Mismatch between seed data ID ('${mockUser.id}') and existing auth UID ('${userRecord.uid}'). The auth user was NOT updated.`);
                        continue;
                    }
                } else {
                    userRecord = await auth.createUser({
                        uid: mockUser.id,
                        email: mockUser.email,
                        password: mockUser.password,
                        displayName: mockUser.name,
                    });
                    logs.push(`Created auth user for ${mockUser.email} with UID: ${userRecord.uid}.`);
                }

                const userDocRef = db.collection('users').doc(userRecord.uid);
                await userDocRef.set({
                    name: userRecord.displayName,
                    email: userRecord.email,
                    role: 'vendor',
                    region: 'SG',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                }, { merge: true });
                logs.push(`Upserted Firestore user document for UID: ${userRecord.uid}.`);

            } catch (e: any) {
                if (e.code === 'auth/uid-already-exists' || e.code === 'auth/email-already-exists') {
                    logs.push(`Auth user for ${mockUser.email} or UID ${mockUser.id} already exists. Skipping creation.`);
                } else {
                    logs.push(`ERROR creating user for ${mockUser.email}: ${e.message}`);
                    console.error(`Error for ${mockUser.email}:`, e);
                }
            }
        }
        
        logs.push("Finished creating mock vendor auth users.");
        return { success: true, logs };

    } catch (error) {
        console.error("Error creating mock auth users:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        logs.push(`CRITICAL ERROR: ${errorMessage}`);
        return { success: false, logs, error: errorMessage };
    }
}

async function deleteCollection(db: FirebaseFirestore.Firestore, collectionRef: FirebaseFirestore.CollectionReference, batchSize: number): Promise<string> {
    const query = collectionRef.limit(batchSize);
    let snapshot = await query.get();
    let deletedCount = 0;

    if (snapshot.empty) {
        return `Collection '${collectionRef.path}' is already empty.`;
    }

    while (snapshot.size > 0) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        const numDeleted = snapshot.size;
        deletedCount += numDeleted;
        
        if (numDeleted < batchSize) {
            break;
        }

        snapshot = await query.get();
    }
    
    return `Deleted ${deletedCount} documents from '${collectionRef.path}'.`;
}

export async function clearVendorsAndCategories(): Promise<{ success: boolean; logs: string[]; error?: string; }> {
    const logs: string[] = ["Starting to clear all mock data..."];
    try {
        const adminApp = getAdminApp();
        const db = getFirestore(adminApp);
        const batchSize = 200;
        
        const collectionsToDelete = ["vendors", "categories", "promotions"];
        for (const collectionName of collectionsToDelete) {
            logs.push(`--- Clearing root '${collectionName}' collection ---`);
            const collectionRef = db.collection(collectionName);
            const deleteLog = await deleteCollection(db, collectionRef, batchSize);
            logs.push(deleteLog);
        }

        logs.push("Successfully cleared all specified collections.");
        return { success: true, logs };

    } catch (error) {
        console.error("Error clearing collections:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during clearing.";
        logs.push(`CRITICAL ERROR: ${errorMessage}`);
        return { success: false, logs, error: errorMessage };
    }
}

export async function updateSearchableFields(): Promise<{ success: boolean; count: number, error?: string; }> {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    const vendorsRef = db.collection("vendors");
    const snapshot = await vendorsRef.get();

    if (snapshot.empty) {
      return { success: true, count: 0, error: "No vendors found to update." };
    }

    let updatedCount = 0;
    const MAX_BATCH_SIZE = 500;
    let batch = db.batch();

    for (let i = 0; i < snapshot.docs.length; i++) {
        const doc = snapshot.docs[i];
        const vendorData = doc.data();
        const name = vendorData.name || "";
        
        const searchableName = name.toLowerCase();
        const searchableNameTokens = searchableName.split(/\s+/).filter(Boolean);
        
        batch.update(doc.ref, { 
            searchableName: searchableName,
            searchableNameTokens: searchableNameTokens 
        });
        updatedCount++;
        
        if (updatedCount % MAX_BATCH_SIZE === 0 || i === snapshot.docs.length - 1) {
            await batch.commit();
            batch = db.batch();
        }
    }

    return { success: true, count: updatedCount };
  } catch (error) {
    console.error("Error migrating searchableNameTokens:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during migration.";
    return { success: false, count: 0, error: errorMessage };
  }
}
