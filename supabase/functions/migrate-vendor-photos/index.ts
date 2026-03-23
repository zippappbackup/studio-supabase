// FULL MIGRATION TOOL
// Migrates vendor photos from Google Places to Supabase Storage
// Skips already migrated vendors (photos already pointing to Supabase)
// Called in batches from the UI with offset for resume capability

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getFreshPhotoReferences(placeId: string, apiKey: string): Promise<string[]> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Places API HTTP error: ${response.status}`)
  
  const data = await response.json()
  if (data.status === 'REQUEST_DENIED') throw new Error(`Places API denied: ${data.error_message}`)
  if (data.status === 'OVER_QUERY_LIMIT') throw new Error('Google Places API quota exceeded')
  if (data.status !== 'OK') return []
  if (!data.result?.photos) return []
  
  return data.result.photos.map((p: any) => p.photo_reference)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const logs: string[] = []

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const placesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')!

    if (!placesApiKey) throw new Error('GOOGLE_PLACES_API_KEY secret not set')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const { data: userData } = await supabase.from('users').select('role').eq('uid', user.id).single()
    if (!userData || userData.role !== 'admin') throw new Error('Admin access required')

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const limit = body.limit || 5

    logs.push(`Starting batch of ${limit} vendors...`)

    // Get total count of unmigrated vendors
    const { count: totalRemaining } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .like('vendor_id', 'ChIJ%')
      .not('photos', 'is', null)
      .not('photos', 'eq', '[]')
      .filter('photos::text', 'like', '%maps.googleapis.com%')

    logs.push(`Total unmigrated vendors remaining: ${totalRemaining}`)

    if (!totalRemaining || totalRemaining === 0) {
      return new Response(
        JSON.stringify({ data: { success: true, message: 'All vendors already migrated!', processed: 0, failed: 0, total_remaining: 0, logs } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get next batch of unmigrated vendors - always offset 0 since filter excludes migrated ones
    const { data: vendors, error: queryError } = await supabase
      .from('vendors')
      .select('vendor_id, name, photos')
      .like('vendor_id', 'ChIJ%')
      .not('photos', 'is', null)
      .not('photos', 'eq', '[]')
      .filter('photos::text', 'like', '%maps.googleapis.com%')
      .limit(limit)

    if (queryError) throw queryError
    if (!vendors || vendors.length === 0) {
      return new Response(
        JSON.stringify({ data: { success: true, message: 'No more vendors to process.', processed: 0, failed: 0, total_remaining: 0, logs } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logs.push(`Processing ${vendors.length} vendors in this batch...`)

    let processedCount = 0
    let failedCount = 0

    for (const vendor of vendors) {
      logs.push(`[${vendor.name}] Fetching fresh photo references...`)

      let photoReferences: string[] = []
      try {
        photoReferences = await getFreshPhotoReferences(vendor.vendor_id, placesApiKey)
      } catch (e: any) {
        if (e.message.includes('quota')) {
          logs.push(`QUOTA EXCEEDED - stopping migration immediately`)
          throw e
        }
        logs.push(`[${vendor.name}] FAILED to get references: ${e.message}`)
        failedCount++
        continue
      }

      if (photoReferences.length === 0) {
        logs.push(`[${vendor.name}] SKIPPED - no photos on Google Places`)
        // Set empty array so this vendor is excluded from future runs
        await supabase.from('vendors')
          .update({ photos: [], updated_at: new Date().toISOString() })
          .eq('vendor_id', vendor.vendor_id)
        continue
      }

      logs.push(`[${vendor.name}] Got ${photoReferences.length} photos - downloading...`)

      const newPhotoUrls: string[] = []

      for (let i = 0; i < photoReferences.length; i++) {
        const photoRef = photoReferences[i]
        const freshUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photoreference=${photoRef}&key=${placesApiKey}`

        try {
          const photoResponse = await fetch(freshUrl)
          if (!photoResponse.ok) {
            logs.push(`[${vendor.name}] Photo ${i + 1}: FAILED HTTP ${photoResponse.status}`)
            continue
          }

          const photoBuffer = new Uint8Array(await photoResponse.arrayBuffer())
          const fileName = `vendor-photos/${vendor.vendor_id}/${photoRef.substring(0, 40)}.jpg`

          const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(fileName, photoBuffer, {
              contentType: 'image/jpeg',
              upsert: true,
              cacheControl: '31536000',
            })

          if (uploadError) {
            logs.push(`[${vendor.name}] Photo ${i + 1}: UPLOAD FAILED - ${uploadError.message}`)
            continue
          }

          const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName)
          newPhotoUrls.push(urlData.publicUrl)

          // Delay between photo downloads to avoid rate limiting
          if (i < photoReferences.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        } catch (photoError: any) {
          logs.push(`[${vendor.name}] Photo ${i + 1}: ERROR - ${photoError.message}`)
        }
      }

      if (newPhotoUrls.length > 0) {
        const { error: updateError } = await supabase
          .from('vendors')
          .update({ photos: newPhotoUrls, updated_at: new Date().toISOString() })
          .eq('vendor_id', vendor.vendor_id)

        if (updateError) {
          logs.push(`[${vendor.name}] DB UPDATE FAILED - ${updateError.message}`)
          failedCount++
        } else {
          logs.push(`[${vendor.name}] SUCCESS - ${newPhotoUrls.length} photos migrated`)
          processedCount++
        }
      } else {
        logs.push(`[${vendor.name}] FAILED - no photos could be downloaded`)
        failedCount++
      }

      // Delay between vendors
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Get updated remaining count after this batch
    const { count: newRemaining } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .like('vendor_id', 'ChIJ%')
      .not('photos', 'is', null)
      .not('photos', 'eq', '[]')
      .filter('photos::text', 'like', '%maps.googleapis.com%')

    logs.push(`Batch complete. Processed: ${processedCount}, Failed: ${failedCount}, Remaining: ${newRemaining}`)

    return new Response(
      JSON.stringify({
        data: {
          success: true,
          message: `Batch complete. ${processedCount} vendors migrated.`,
          processed: processedCount,
          failed: failedCount,
          total_remaining: newRemaining || 0,
          logs,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    logs.push(`CRITICAL ERROR: ${error.message}`)
    return new Response(
      JSON.stringify({ data: { success: false, message: error.message, processed: 0, failed: 0, total_remaining: -1, logs } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
