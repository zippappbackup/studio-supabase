// FORCE DEPLOY 25
import { onCall, HttpsError, onRequest, CallableRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import type { Vendor } from "./types";
import { searchPlacesByKeyword, fetchPlaceDetails } from "./google-places-api";
import fetch from "node-fetch";
import cors from 'cors';

const corsHandler = cors({ origin: true });

// Correctly initialize the Firebase Admin SDK.
// Let the environment provide the credentials and configuration.
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
// Use the default bucket associated with the Firebase project.
const storage = admin.storage().bucket();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

export const uploadImage = onCall({ region: "us-central1" }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', "Authentication required to upload files.");
    }

    const { file, path } = request.data;
    if (!file || !path) {
        throw new HttpsError('invalid-argument', 'The function must be called with "file" and "path" arguments.');
    }

    try {
        const mimeType = file.match(/data:(.*);base64,/)?.[1];
        if (!mimeType) {
            throw new HttpsError('invalid-argument', 'Invalid data URI format.');
        }

        const base64EncodedImageString = file.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64EncodedImageString, 'base64');
        
        const fileUpload = storage.file(path);
        
        await fileUpload.save(imageBuffer, {
            metadata: {
                contentType: mimeType,
            },
            public: true, // Make the file publicly readable
        });
        
        return { success: true, url: fileUpload.publicUrl() };

    } catch (error: any) {
        logger.error(`Image upload failed for path: ${path}`, error);
        throw new HttpsError('internal', `Image upload failed: ${error.message}`);
    }
});


export const migrateVendorPhotos = onRequest({ region: "us-central1", timeoutSeconds: 540, secrets: ["PLACES_KEY"], cors: true }, async (req, res) => {
    // Manually handle CORS preflight requests.
    // This is the definitive fix for the CORS policy error.
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    
    // The rest of the function logic remains inside the try/catch block.
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).send('Unauthorized');
            return;
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.data()?.role !== 'admin') {
            res.status(403).send('Permission denied.');
            return;
        }

        const { limit = 10 } = req.body.data;
        const apiKey = process.env.PLACES_KEY;

        if (!apiKey) {
            logger.error("migrateVendorPhotos: PLACES_KEY secret is not configured.");
            res.status(500).send({ error: "Server configuration error: Missing API key." });
            return;
        }
        
        const logs: string[] = [`Starting batch migration for up to ${limit} vendors.`];
        
        const snapshot = await db.collection('vendorsWithInvalidPhotos').limit(limit).get();
        
        if (snapshot.empty) {
            logs.push("No vendors found in 'vendorsWithInvalidPhotos' collection.");
            res.status(200).send({ data: { success: true, message: "No vendors to process.", logs } });
            return;
        }

        const vendorIds = snapshot.docs.map(doc => doc.id);
        logs.push(`Found ${vendorIds.length} vendors to process.`);
        
        const vendorDocs = await db.collection('vendors').where(admin.firestore.FieldPath.documentId(), 'in', vendorIds).get();
        const vendorsToProcess: Vendor[] = vendorDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));

        let processedCount = 0;
        for (const vendor of vendorsToProcess) {
            const vendorLogPrefix = `[Vendor: ${vendor.id}]`;
            logs.push(`${vendorLogPrefix} Processing...`);

            if (!vendor.googlePlaceId) {
                logs.push(`${vendorLogPrefix} SKIPPED: Missing googlePlaceId.`);
                await db.collection('vendorsWithInvalidPhotos').doc(vendor.id).delete();
                continue;
            }

            const placeDetails = await fetchPlaceDetails(vendor.googlePlaceId, apiKey);
            if (!placeDetails || !placeDetails.photos || placeDetails.photos.length === 0) {
                logs.push(`${vendorLogPrefix} SKIPPED: No photos found via Place Details API.`);
                await db.collection('vendorsWithInvalidPhotos').doc(vendor.id).delete();
                continue;
            }

            const newPhotoUrls: string[] = [];
            for (const photoUrl of placeDetails.photos) {
                const url = new URL(photoUrl);
                const photoRef = url.searchParams.get('photoreference');
                if (!photoRef) continue;

                const filePath = `place-photos/${photoRef}.jpg`;
                const file = storage.file(filePath);
                
                try {
                    const gcpResponse = await fetch(photoUrl);
                    if (!gcpResponse.ok || !gcpResponse.body) {
                        throw new Error(`Google fetch failed with status ${gcpResponse.status}`);
                    }
                    const buffer = await gcpResponse.arrayBuffer();
                    await file.save(Buffer.from(buffer), { public: true, metadata: { contentType: 'image/jpeg' } });
                    
                    newPhotoUrls.push(file.publicUrl());
                } catch (fetchError: any) {
                    logs.push(`${vendorLogPrefix} ERROR fetching photo ${photoRef}: ${fetchError.message}`);
                }
            }

            if (newPhotoUrls.length > 0) {
                await db.collection('vendors').doc(vendor.id).update({ photos: newPhotoUrls, updatedAt: serverTimestamp() });
                logs.push(`${vendorLogPrefix} SUCCESS: Updated with ${newPhotoUrls.length} photos.`);
            } else {
                logs.push(`${vendorLogPrefix} WARNING: No valid photos could be downloaded.`);
            }
            
            await db.collection('vendorsWithInvalidPhotos').doc(vendor.id).delete();
            processedCount++;
        }

        logs.push(`Batch finished. Processed ${processedCount} vendors.`);
        res.status(200).send({ data: { success: true, message: `Batch completed for ${processedCount} vendors.`, logs } });

    } catch (error: any) {
        logger.error("Critical error in migrateVendorPhotos:", error);
        res.status(500).send({ error: error.message || 'An internal server error occurred.' });
    }
});


export const finalizeVendorClaim = onCall({ region: "us-central1" }, async (request: CallableRequest) => {
    const { vendorId } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in to claim a vendor.");
    }
    if (!vendorId) {
      throw new HttpsError("invalid-argument", "The function must be called with a 'vendorId'.");
    }

    const vendorRef = db.collection("vendors").doc(vendorId);

    try {
      await db.runTransaction(async (transaction) => {
        const vendorDoc = await transaction.get(vendorRef);

        if (!vendorDoc.exists) {
          return Promise.reject(
            new HttpsError("not-found", `Vendor ${vendorId} not found.`)
          );
        }
        
        const vendorData = vendorDoc.data();
        
        const alreadyClaimed = vendorData?.claimedBy != null && vendorData.claimedBy !== "";

        if (alreadyClaimed) {
          return Promise.reject(
            new HttpsError(
              "failed-precondition",
              "This business has already been claimed."
            )
          );
        }

        transaction.update(vendorRef, {
          claimedBy: uid,
          subscriptionStatus: 'trial',
          trialStartedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      logger.log(`Successfully claimed vendor ${vendorId} for user ${uid}.`);
      return { success: true, message: "Vendor claimed successfully." };

    } catch (error: any) {
      logger.error(`Error finalizing claim for vendor ${vendorId} by user ${uid}:`, error);
      if (error.code && error.message && error instanceof HttpsError === false) {
          throw error;
      }
      throw new HttpsError("internal", "An unexpected error occurred while finalizing the claim.");
    }
  });

export const getVendorDataset = onCall({ region: "us-central1" }, async (request: CallableRequest) => {
    try {
      const configRef = db.collection("config").doc("vendorDataset");
      const configSnap = await configRef.get();

      if (!configSnap.exists) {
        throw new HttpsError("not-found", "Configuration for the vendor dataset could not be found.");
      }

      const { filePath, version } = configSnap.data() as any;

      if (!filePath || !version) {
        throw new HttpsError("invalid-argument", "Dataset configuration is incomplete. Missing 'filePath' or 'version'.");
      }
      
      if (request.data && request.data.version && request.data.version === version) {
        return { version, status: 'not-modified' };
      }

      const file = storage.file(filePath);
      const [contents] = await file.download();
      const dataset = JSON.parse(contents.toString("utf8"));

      return {
        version,
        status: 'modified',
        data: {
            vendors: dataset,
            generatedAt: new Date().getTime()
        }
      };
    } catch (err: any) {
      logger.error("CRITICAL FAILURE in getVendorDataset:", err);
      throw new HttpsError("internal", err.message, err);
    }
  });

export const manuallyGenerateVendorSnapshot = onCall({ region: "us-central1", timeoutSeconds: 300, cors: true }, async (request) => {
    logger.info("SERVER LOG: Function 'manuallyGenerateVendorSnapshot' started.");
    try {
      if (!request.auth) {
        throw new HttpsError(
          "unauthenticated",
          "You must be logged in to perform this action."
        );
      }
      const userDoc = await db.collection('users').doc(request.auth.uid).get();
      if (userDoc.data()?.role !== 'admin') {
          throw new HttpsError(
          "permission-denied",
          "You must be an admin to perform this action."
        );
      }

      logger.info(`SERVER LOG: Auth check passed for admin user: ${request.auth.uid}.`);
      logger.info("SERVER LOG: Calling internal 'generateAndUploadVendorSnapshot' function.");
      const result = await generateAndUploadVendorSnapshot();
      logger.info("SERVER LOG: Internal 'generateAndUploadVendorSnapshot' function completed successfully.");

      return {
        success: true,
        message: "Snapshot generated successfully.",
        details: result,
      };
    } catch (error: any) {
      logger.error("CRITICAL SERVER ERROR: 'manuallyGenerateVendorSnapshot' failed:", error);
      const errorMessage = error.message || "An unknown internal error occurred.";
      const errorDetails = error.details || error;
      throw new HttpsError("internal", errorMessage, errorDetails);
    }
  });

async function generateAndUploadVendorSnapshot() {
    logger.info("SERVER LOG: generateAndUploadVendorSnapshot: Starting...");

    const vendorsSnapshot = await db.collection("vendors").get();
    logger.info(`SERVER LOG: Successfully fetched ${vendorsSnapshot.size} vendor documents.`);
    
    const snapshotData = vendorsSnapshot.docs.map(doc => {
        const vendorData = doc.data();
        
        const leanVendor = {
            id: doc.id,
            name: vendorData.name,
            searchableName: vendorData.searchableName,
            categoryId: vendorData.categoryId,
            logoUrl: vendorData.logoUrl || null,
            address: vendorData.address,
            lat: vendorData.lat,
            lng: vendorData.lng,
            region: vendorData.region,
            googleRating: vendorData.googleRating || 0,
            googleReviewCount: vendorData.googleReviewCount || 0,
            zippRating: vendorData.zippRating || 0,
            zippReviewCount: vendorData.zippReviewCount || 0,
            tags: vendorData.tags || [],
            types: vendorData.types || [],
            matchedKeywords: vendorData.matchedKeywords || [],
            photos: vendorData.photos ? vendorData.photos.slice(0, 1) : [],
            subscriptionStatus: vendorData.subscriptionStatus,
        };
        
        return leanVendor;
    });

    const now = new Date();
    const version = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `vendordataset_${version}.json`;
    const filePath = `snapshots/${fileName}`;

    const file = storage.file(filePath);

    await file.save(JSON.stringify(snapshotData), {
        contentType: "application/json",
        resumable: false,
    });
    logger.info(`SERVER LOG: Lean snapshot successfully saved to Storage at: ${filePath}`);

    const configRef = db.collection("config").doc("vendorDataset");
    await configRef.set({
        filePath: filePath,
        version: version,
    }, { merge: true });
    logger.info("SERVER LOG: '/config/vendorDataset' document updated successfully.");

    return { filePath, count: snapshotData.length, version: version };
}

export const updateZippHighlights = onSchedule({ region: "us-central1", schedule: 'every 24 hours' }, async (event) => {
    logger.info("Starting daily job: updateZippHighlights");
    try {
        const categories = ["car care", "cleaning services", "handyman services", "mobile device repair"];
        let highlights: Vendor[] = [];
        const vendorsRef = db.collection('vendors');

        for (const categoryId of categories) {
            const querySnapshot = await vendorsRef
                .where('categoryId', '==', categoryId)
                .where('googleRating', '>=', 4.5)
                .get();

            const vendorsInCategory = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vendor[];

            const eligibleVendors = vendorsInCategory.filter(v => 
                (v.logoUrl || (v.photos && v.photos.length > 0))
            );

            const shuffledVendors = shuffleArray(eligibleVendors);
            
            const topTwo = shuffledVendors.slice(0, 2);
            highlights.push(...topTwo);
        }

        const finalVendors = highlights.slice(0, 8);

        const highlightsRef = db.collection('zippHighlights').doc('singleton');
        await highlightsRef.set({
            vendors: finalVendors,
            updatedAt: serverTimestamp(),
        });

        logger.log(`Successfully updated Zipp Highlights with ${finalVendors.length} vendors.`);
    } catch (error) {
        logger.error("CRITICAL ERROR in updateZippHighlights:", error);
    }
});

export const onVendorCreate = onDocumentCreated({ region: "us-central1", document: 'vendors/{vendorId}' }, async (event) => {
    const statsRef = db.collection('analytics').doc('stats');
    try {
        await statsRef.set({
            totalVendors: admin.firestore.FieldValue.increment(1)
        }, { merge: true });
    } catch (error) {
        logger.error("Error incrementing vendor count:", error);
    }
});

export const onVendorDelete = onDocumentDeleted({ region: "us-central1", document: 'vendors/{vendorId}' }, async (event) => {
    const statsRef = db.collection('analytics').doc('stats');
    try {
        await statsRef.set({
            totalVendors: admin.firestore.FieldValue.increment(-1)
        }, { merge: true });
    } catch (error) {
        logger.error("Error decrementing vendor count:", error);
    }
});

export const scheduledVendorSnapshot = onSchedule({ region: "us-central1", schedule: 'every 4 hours' }, async (event) => {
    logger.info("SERVER LOG: Function 'scheduledVendorSnapshot' started. V2-DEPLOY-TEST");
    try {
        await generateAndUploadVendorSnapshot();
        logger.info("SERVER LOG: 'scheduledVendorSnapshot' completed successfully.");
    } catch (error) {
        logger.error("CRITICAL SERVER ERROR: 'scheduledVendorSnapshot' failed:", error);
    }
});

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const placePhotoProxy = onRequest({ secrets: ["PLACES_KEY"], cors: true, region: 'us-central1' }, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
        return;
    }
    
    try {
      const photoRef = req.query.ref as string;
      if (!photoRef) {
        res.status(400).send("Missing 'ref' query parameter for photo reference.");
        return;
      }
      
      const apiKey = process.env.PLACES_KEY;
      if (!apiKey) {
        logger.error("placePhotoProxy: CRITICAL - PLACES_KEY secret is not set or not accessible.");
        res.status(500).send("Server configuration error: Missing API key.");
        return;
      }

      const filePath = `place-photos/${photoRef}.jpg`;
      const file = storage.file(filePath);
      const [exists] = await file.exists();

      if (exists) {
          const [url] = await file.getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
          });
          res.redirect(url);
          return;
      }

      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${apiKey}`;
      
      const response = await fetch(photoUrl);

      if (!response.ok || !response.body) {
        res.status(response.status).send(`Failed to fetch image from Google. Status: ${response.statusText}`);
        return;
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      const buffer = await response.arrayBuffer();

      await file.save(Buffer.from(buffer), {
          public: true,
          metadata: { contentType, cacheControl: 'public, max-age=31536000' },
      });
      
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
      });
      res.redirect(url);

    } catch (e: any) {
      logger.error("placePhotoProxy critical error:", e);
      res.status(500).send(`An internal error occurred: ${e.message}`);
    }
});

export const manuallyRunZippHighlights = onRequest({ region: "us-central1" }, (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    
    try {
      // Re-implementing the core logic of updateZippHighlights for manual trigger
      logger.info("Manually running Zipp Highlights job...");
      const categories = ["car care", "cleaning services", "handyman services", "mobile device repair"];
      let highlights: Vendor[] = [];
      const vendorsRef = db.collection('vendors');

      for (const categoryId of categories) {
        const querySnapshot = await vendorsRef
            .where('categoryId', '==', categoryId)
            .where('googleRating', '>=', 4.5)
            .get();

        const vendorsInCategory = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vendor[];
        const eligibleVendors = vendorsInCategory.filter(v => (v.logoUrl || (v.photos && v.photos.length > 0)));
        const shuffledVendors = shuffleArray(eligibleVendors);
        const topTwo = shuffledVendors.slice(0, 2);
        highlights.push(...topTwo);
      }

      const finalVendors = highlights.slice(0, 8);
      const highlightsRef = db.collection('zippHighlights').doc('singleton');
      await highlightsRef.set({
          vendors: finalVendors,
          updatedAt: serverTimestamp(),
      });
      
      logger.log(`Successfully updated Zipp Highlights with ${finalVendors.length} vendors.`);
      res.status(200).send({ success: true, message: "Zipp Highlights job ran successfully." });

    } catch (e: any) {
      logger.error("Error in manuallyRunZippHighlights:", e);
      res.status(500).send({ success: false, error: e.message });
    }
  });
});
