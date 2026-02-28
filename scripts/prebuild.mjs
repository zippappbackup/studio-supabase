// scripts/prebuild.mjs
import admin from 'firebase-admin';
import { promises as fs } from 'fs';
import path from 'path';

// --- IMPORTANT ---
// This script requires Google Application Default Credentials to be set up in the build environment.
// It will not work if the service account key is the only method of authentication.
// https://cloud.google.com/docs/authentication/provide-credentials-adc

// --- Configuration ---
const VENDOR_COLLECTION = 'vendors';
const OUTPUT_FILE = 'src/lib/vendor-ids.json';

async function getAdminApp() {
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }
  // This automatically uses Application Default Credentials in a deployed environment.
  return admin.initializeApp();
}

async function fetchVendorIds() {
  console.log('--- Starting pre-build script: Fetching vendor IDs ---');
  try {
    const adminApp = await getAdminApp();
    const db = admin.firestore(adminApp);

    console.log(`Querying '${VENDOR_COLLECTION}' collection...`);
    const vendorsSnapshot = await db.collection(VENDOR_COLLECTION).select().get();
    
    if (vendorsSnapshot.empty) {
      console.warn('Warning: No vendors found in the collection. The vendor ID list will be empty.');
      return [];
    }

    const vendorIds = vendorsSnapshot.docs.map(doc => doc.id);
    console.log(`Successfully fetched ${vendorIds.length} vendor IDs.`);
    
    return vendorIds;
  } catch (error) {
    console.error('CRITICAL ERROR: Failed to fetch vendor IDs from Firestore.', error);
    // Exit with a non-zero code to fail the build if Firestore connection fails.
    process.exit(1);
  }
}

async function writeVendorIdsToFile(ids) {
  try {
    const outputPath = path.resolve(process.cwd(), OUTPUT_FILE);
    const outputDir = path.dirname(outputPath);

    // Ensure the directory exists
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(outputPath, JSON.stringify(ids, null, 2));
    console.log(`Successfully wrote ${ids.length} vendor IDs to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error(`CRITICAL ERROR: Failed to write vendor IDs to file at ${OUTPUT_FILE}.`, error);
    process.exit(1);
  }
}

async function main() {
  const ids = await fetchVendorIds();
  await writeVendorIdsToFile(ids);
  console.log('--- Pre-build script finished successfully. ---');
}

main();
