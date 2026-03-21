// src/lib/nominatim.ts
"use server";


/**
 * Geocodes an address using the free Nominatim API.
 * This function is designed to be used on the server side.
 * @param address The address or landmark to search for.
 * @returns A promise that resolves to the geocoded address output or null.
 */
export async function geocodeAddressWithNominatim(address: string): Promise<{latitude: number; longitude: number; formattedAddress: string} | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&countrycodes=sg&limit=1`;

  try {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Zipp-Super-App/1.0 (hello@zipp.com)' } // Required by Nominatim
    });
    if (!response.ok) {
        console.error(`Nominatim API call failed with status: ${response.status}`);
        return null;
    }
    const data = await response.json() as any[];

    if (data && data.length > 0) {
      const { lat, lon, display_name } = data[0];
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        formattedAddress: display_name
      };
    }
    return null;
  } catch (error) {
    console.error("Error calling Nominatim API:", error);
    return null;
  }
}
