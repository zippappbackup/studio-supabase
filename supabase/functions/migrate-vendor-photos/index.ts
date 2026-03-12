// Supabase Edge Function: migrate-vendor-photos
// Deploy to: supabase/functions/migrate-vendor-photos/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MigrationRequest {
  limit?: number;
}

interface GooglePlaceDetails {
  photos?: string[];
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<GooglePlaceDetails | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Google Places API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.result?.photos) {
      return null;
    }
    
    // Build photo URLs
    const photoUrls = data.result.photos.map((photo: any) => {
      const photoReference = photo.photo_reference;
      const maxWidth = 1600; // High quality photos
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
    });
    
    return { photos: photoUrls };
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('uid', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Permission denied. Admin access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestBody: MigrationRequest = await req.json()
    const limit = requestBody.limit || 10

    // Get Google Places API key
    const placesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') || 'PLACEHOLDER_KEY'
    
    if (placesApiKey === 'PLACEHOLDER_KEY') {
      console.warn('WARNING: Using placeholder Google Places API key')
    }

    const logs: string[] = [`Starting batch migration for up to ${limit} vendors.`]

    // Query vendors with invalid photos
    // For now, we'll query vendors that have Google Place IDs but might need photo refresh
    // You'll need to create a custom query or table for tracking invalid photos
    const { data: vendorsToMigrate, error: queryError } = await supabase
      .from('vendors')
      .select('*')
      .not('google_place_id', 'is', null)
      .limit(limit)

    if (queryError) {
      throw queryError
    }

    if (!vendorsToMigrate || vendorsToMigrate.length === 0) {
      logs.push('No vendors found to process.')
      return new Response(
        JSON.stringify({ data: { success: true, message: 'No vendors to process.', logs } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logs.push(`Found ${vendorsToMigrate.length} vendors to process.`)

    let processedCount = 0

    for (const vendor of vendorsToMigrate) {
      const vendorLogPrefix = `[Vendor: ${vendor.vendor_id}]`
      logs.push(`${vendorLogPrefix} Processing...`)

      if (!vendor.google_place_id) {
        logs.push(`${vendorLogPrefix} SKIPPED: Missing google_place_id.`)
        continue
      }

      // Fetch photos from Google Places API
      const placeDetails = await fetchPlaceDetails(vendor.google_place_id, placesApiKey)
      
      if (!placeDetails || !placeDetails.photos || placeDetails.photos.length === 0) {
        logs.push(`${vendorLogPrefix} SKIPPED: No photos found via Place Details API.`)
        continue
      }

      const newPhotoUrls: string[] = []

      // Download and upload each photo
      for (const photoUrl of placeDetails.photos) {
        try {
          const url = new URL(photoUrl)
          const photoRef = url.searchParams.get('photoreference')
          if (!photoRef) continue

          // Download photo from Google
          const photoResponse = await fetch(photoUrl)
          if (!photoResponse.ok) {
            logs.push(`${vendorLogPrefix} ERROR: Google fetch failed with status ${photoResponse.status}`)
            continue
          }

          const photoBlob = await photoResponse.blob()
          const photoArrayBuffer = await photoBlob.arrayBuffer()
          const photoBuffer = new Uint8Array(photoArrayBuffer)

          // Upload to Supabase Storage
          const fileName = `place-photos/${photoRef}.jpg`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(fileName, photoBuffer, {
              contentType: 'image/jpeg',
              upsert: true,
              cacheControl: '31536000', // 1 year
            })

          if (uploadError) {
            logs.push(`${vendorLogPrefix} ERROR uploading photo: ${uploadError.message}`)
            continue
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName)

          if (urlData.publicUrl) {
            newPhotoUrls.push(urlData.publicUrl)
          }
        } catch (fetchError) {
          logs.push(`${vendorLogPrefix} ERROR processing photo: ${fetchError.message}`)
        }
      }

      // Update vendor with new photo URLs
      if (newPhotoUrls.length > 0) {
        const { error: updateError } = await supabase
          .from('vendors')
          .update({
            photos: newPhotoUrls,
            updated_at: new Date().toISOString(),
          })
          .eq('vendor_id', vendor.vendor_id)

        if (updateError) {
          logs.push(`${vendorLogPrefix} ERROR updating database: ${updateError.message}`)
        } else {
          logs.push(`${vendorLogPrefix} SUCCESS: Updated with ${newPhotoUrls.length} photos.`)
          processedCount++
        }
      } else {
        logs.push(`${vendorLogPrefix} WARNING: No valid photos could be downloaded.`)
      }
    }

    logs.push(`Batch finished. Processed ${processedCount} vendors.`)

    return new Response(
      JSON.stringify({
        data: {
          success: true,
          message: `Batch completed for ${processedCount} vendors.`,
          logs,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Critical error in migrate-vendor-photos:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An internal server error occurred.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
