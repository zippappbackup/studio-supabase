'use server';

import type { GeocodeResult } from "@/lib/types";

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&countrycodes=sg&limit=1`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Zipp-Super-App/1.0 (hello@zipp.com)' }
    });

    if (!response.ok) {
      return { success: false, error: `Geocoding service error: ${response.status}` };
    }

    const data = await response.json() as any[];

    if (data && data.length > 0) {
      const { lat, lon, display_name } = data[0];
      const isLandmark = display_name.split(',').length < 4;
      return {
        success: true,
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        address: display_name,
        isLandmark,
      };
    }

    return {
      success: false,
      error: `Could not find a location for "${address}". Please try a more specific address.`
    };

  } catch (error: any) {
    return { success: false, error: error.message || 'An unknown error occurred' };
  }
}
