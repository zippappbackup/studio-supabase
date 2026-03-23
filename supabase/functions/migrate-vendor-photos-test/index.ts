// TEST MIGRATION TOOL - Processes exactly 1 vendor, ALL photos
// Uses Google Places Details API to get fresh photo references
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getFreshPhotoReferences(placeId: string, apiKey: string): Promise<string[]> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Places API error: ${response.status}`)
  
  const data = await response.json()
  if (data.status !== 'OK') throw new Error(`Places API status: ${data.status} - ${data.error_message || ''}`)
  if (!data.result?.photos) return []
  
  return data.result.photos.map((p: any) => p.photo_reference)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const logs: string[] = ['[TEST] Starting single vendor photo migration test...']

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

    // Get exactly 1 vendor with Google Place ID
    logs.push('[TEST] Fetching 1 vendor...')
    const { data: vendors, error: queryError } = await supabase
      .from('vendors')
      .select('vendor_id, name, photos')
      .like('vendor_id', 'ChIJ%')
      .not('photos', 'eq', '[]')
      .not('photos', 'is', null)
      .limit(1)

    if (queryError) throw queryError
    if (!vendors || vendors.length === 0) throw new Error('No vendors found')

    const vendor = vendors[0]
    logs.push(`[TEST] Selected vendor: ${vendor.name} (${vendor.vendor_id})`)

    // Get FRESH photo references from Google Places API
    logs.push('[TEST] Fetching fresh photo references from Google Places API...')
    const photoReferences = await getFreshPhotoReferences(vendor.vendor_id, placesApiKey)
    
    if (photoReferences.length === 0) throw new Error('No photos found for this vendor on Google Places')
    logs.push(`[TEST] Got ${photoReferences.length} fresh photo references from Google`)

    const newPhotoUrls: string[] = []
    let failCount = 0

    for (let i = 0; i < photoReferences.length; i++) {
      const photoRef = photoReferences[i]
      const freshUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photoreference=${photoRef}&key=${placesApiKey}`

      logs.push(`[TEST] Photo ${i + 1}/${photoReferences.length}: Downloading...`)
      const photoResponse = await fetch(freshUrl)

      if (!photoResponse.ok) {
        logs.push(`[TEST] Photo ${i + 1}/${photoReferences.length}: FAILED - HTTP ${photoResponse.status}`)
        failCount++
        continue
      }

      const photoBuffer = new Uint8Array(await photoResponse.arrayBuffer())
      logs.push(`[TEST] Photo ${i + 1}/${photoReferences.length}: Downloaded ${photoBuffer.length} bytes`)

      const fileName = `vendor-photos/${vendor.vendor_id}/${photoRef.substring(0, 40)}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, photoBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '31536000',
        })

      if (uploadError) {
        logs.push(`[TEST] Photo ${i + 1}/${photoReferences.length}: UPLOAD FAILED - ${uploadError.message}`)
        failCount++
        continue
      }

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName)
      newPhotoUrls.push(urlData.publicUrl)
      logs.push(`[TEST] Photo ${i + 1}/${photoReferences.length}: SUCCESS - stored in Supabase`)

      // Delay between downloads to avoid rate limiting
      if (i < photoReferences.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    if (newPhotoUrls.length === 0) throw new Error('No photos were successfully migrated')

    // Update vendor with new Supabase URLs
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ photos: newPhotoUrls, updated_at: new Date().toISOString() })
      .eq('vendor_id', vendor.vendor_id)

    if (updateError) throw new Error(`DB update failed: ${updateError.message}`)

    logs.push(`[TEST] DB updated successfully`)
    logs.push(`[TEST] COMPLETE: ${newPhotoUrls.length} migrated, ${failCount} failed out of ${photoReferences.length} total`)

    return new Response(
      JSON.stringify({ data: { success: true, message: `Test complete! ${newPhotoUrls.length}/${photoReferences.length} photos migrated for ${vendor.name}.`, logs } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    logs.push(`[TEST] CRITICAL ERROR: ${error.message}`)
    return new Response(
      JSON.stringify({ data: { success: false, message: error.message, logs } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
