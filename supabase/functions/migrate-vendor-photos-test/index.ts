// TEST MIGRATION TOOL - Processes exactly 1 vendor, ALL photos
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractPhotoReference(url: string): string | null {
  try {
    return new URL(url).searchParams.get('photoreference');
  } catch {
    return null;
  }
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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: userData } = await supabase.from('users').select('role').eq('uid', user.id).single()
    if (!userData || userData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get exactly 1 vendor with unmigrated Google photo URLs
    logs.push('[TEST] Fetching 1 vendor with Google photos...')
    const { data: vendors, error: queryError } = await supabase
      .from('vendors')
      .select('vendor_id, name, photos')
      .like('vendor_id', 'ChIJ%')
      .not('photos', 'eq', '[]')
      .not('photos', 'is', null)
      .limit(1)

    if (queryError) throw queryError
    if (!vendors || vendors.length === 0) throw new Error('No vendors found with photos')

    // Find vendor with unmigrated photos (still pointing to Google)
    const vendor = vendors.find((v: any) => 
      Array.isArray(v.photos) && 
      v.photos.length > 0 && 
      typeof v.photos[0] === 'string' && 
      v.photos[0].includes('maps.googleapis.com')
    )

    if (!vendor) throw new Error('No vendor found with unmigrated Google photos')

    logs.push(`[TEST] Selected vendor: ${vendor.name} (${vendor.vendor_id})`)
    logs.push(`[TEST] Total photos to migrate: ${vendor.photos.length}`)

    const newPhotoUrls: string[] = []
    let failCount = 0

    for (let i = 0; i < vendor.photos.length; i++) {
      const photoUrl = vendor.photos[i]

      if (!photoUrl || typeof photoUrl !== 'string') {
        logs.push(`[TEST] Photo ${i + 1}/${vendor.photos.length}: SKIPPED - invalid URL`)
        failCount++
        continue
      }

      const photoReference = extractPhotoReference(photoUrl)
      if (!photoReference) {
        logs.push(`[TEST] Photo ${i + 1}/${vendor.photos.length}: SKIPPED - no photo reference`)
        failCount++
        continue
      }

      const freshUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photoreference=${photoReference}&key=${placesApiKey}`

      logs.push(`[TEST] Photo ${i + 1}/${vendor.photos.length}: Downloading...`)
      const photoResponse = await fetch(freshUrl)

      if (!photoResponse.ok) {
        logs.push(`[TEST] Photo ${i + 1}/${vendor.photos.length}: FAILED - HTTP ${photoResponse.status}`)
        failCount++
        continue
      }

      const photoBuffer = new Uint8Array(await photoResponse.arrayBuffer())
      logs.push(`[TEST] Photo ${i + 1}/${vendor.photos.length}: Downloaded ${photoBuffer.length} bytes`)

      const fileName = `vendor-photos/${vendor.vendor_id}/${photoReference.substring(0, 40)}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, photoBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '31536000',
        })

      if (uploadError) {
        logs.push(`[TEST] Photo ${i + 1}/${vendor.photos.length}: UPLOAD FAILED - ${uploadError.message}`)
        failCount++
        continue
      }

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName)
      newPhotoUrls.push(urlData.publicUrl)
      logs.push(`[TEST] Photo ${i + 1}/${vendor.photos.length}: SUCCESS`)

      // Small delay between photos to avoid rate limiting
      if (i < vendor.photos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    if (newPhotoUrls.length === 0) throw new Error('No photos were successfully migrated')

    const { error: updateError } = await supabase
      .from('vendors')
      .update({ photos: newPhotoUrls, updated_at: new Date().toISOString() })
      .eq('vendor_id', vendor.vendor_id)

    if (updateError) throw new Error(`DB update failed: ${updateError.message}`)

    logs.push(`[TEST] DB updated successfully`)
    logs.push(`[TEST] COMPLETE: ${newPhotoUrls.length} migrated, ${failCount} failed out of ${vendor.photos.length} total`)

    return new Response(
      JSON.stringify({ data: { success: true, message: `Test complete! ${newPhotoUrls.length}/${vendor.photos.length} photos migrated for ${vendor.name}.`, logs } }),
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
