
"use server";

import type { GeocodeResult } from "@/lib/types";
import { geocodeAddressWithNominatim } from '@/lib/nominatim';

/**
 * Server Action to geocode an address using the Nominatim API.
 * This function no longer interacts with Firestore cache due to authentication issues
 * with the admin SDK in server actions. It directly calls the Nominatim service.
 * The caching logic has been removed to ensure reliability.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const logs: string[] = ["[GEOCODE ACTION] Starting."];
  const lowerCaseAddress = address.toLowerCase().trim();
  logs.push(`[GEOCODE ACTION] Normalized query: "${lowerCaseAddress}"`);

  try {
    // Directly call the Nominatim geocoding service.
    logs.push("[GEOCODE ACTION] Calling Nominatim API...");
    const nominatimResult = await geocodeAddressWithNominatim(address);

    if (nominatimResult && nominatimResult.latitude && nominatimResult.longitude) {
      logs.push(`[GEOCODE ACTION] Nominatim returned success: ${JSON.stringify(nominatimResult)}`);
      const { latitude, longitude, formattedAddress } = nominatimResult;
      const isLandmark = formattedAddress.split(',').length < 4;

      return { success: true, lat: latitude, lng: longitude, address: formattedAddress, isLandmark, logs };
    }

    logs.push(`[GEOCODE ACTION] Nominatim failed to find a location for "${address}".`);
    return {
      success: false,
      error: `Could not find a location for "${address}". Please try a different or more specific address.`,
      logs,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    logs.push(`[GEOCODE ACTION CRITICAL ERROR] ${errorMessage}`);
    console.error("Error in geocodeAddress server action:", error);
    return {
      success: false,
      error: errorMessage,
      logs,
    };
  }
}
