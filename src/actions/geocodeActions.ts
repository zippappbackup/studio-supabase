'use server';

import type { GeocodeResult } from "@/lib/types";

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://studio-supabase.pages.dev';
    const url = `${baseUrl}/api/geocode?address=${encodeURIComponent(address)}`;
    
    const response = await fetch(url);
    const data = await response.json() as GeocodeResult;
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unknown server error occurred.',
    };
  }
}
