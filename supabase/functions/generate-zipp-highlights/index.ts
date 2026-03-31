// ZIPP HIGHLIGHTS GENERATOR
// Selects 2 vendors per category that meet quality criteria
// Criteria: must have logo OR photo, google rating >= 4.5
// Runs daily at midnight Singapore time (16:00 UTC)
// Future-proof: automatically picks up new categories

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VENDORS_PER_CATEGORY = 2
const MIN_RATING = 4.5

// Normalize category_id to match category names
function normalizeCategory(categoryId: string): string {
  return categoryId.toLowerCase().replace(/-/g, ' ').trim()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const logs: string[] = []

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    logs.push('Starting Zipp Highlights generation...')

    // Step 1: Get all active categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('name')

    if (catError) throw catError
    if (!categories || categories.length === 0) throw new Error('No categories found')

    logs.push(`Found ${categories.length} categories: ${categories.map(c => c.name).join(', ')}`)

    // Step 2: For each category, find qualifying vendors
    const selectedVendorIds: string[] = []

    for (const category of categories) {
      const normalizedName = normalizeCategory(category.name)
      logs.push(`Processing category: ${category.name}`)

      // Fetch all vendors in this category with rating >= 4.5
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('vendor_id, name, logo_url, photos, google_rating, category_id')
        .gte('google_rating', MIN_RATING)

      if (vendorError) {
        logs.push(`Error fetching vendors for ${category.name}: ${vendorError.message}`)
        continue
      }

      // Filter by category (handle all format variations) and must have logo or photo
      const qualifying = (vendors || []).filter(v => {
        const vendorCategory = normalizeCategory(v.category_id || '')
        const categoryMatch = vendorCategory === normalizedName
        const hasImage = (v.logo_url && v.logo_url.trim() !== '') || 
                        (v.photos && v.photos.length > 0)
        return categoryMatch && hasImage
      })

      logs.push(`Found ${qualifying.length} qualifying vendors for ${category.name}`)

      if (qualifying.length === 0) continue

      // Randomly shuffle and pick VENDORS_PER_CATEGORY
      const shuffled = qualifying.sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, VENDORS_PER_CATEGORY)

      selected.forEach(v => {
        selectedVendorIds.push(v.vendor_id)
        logs.push(`Selected: ${v.name} (rating: ${v.google_rating})`)
      })
    }

    if (selectedVendorIds.length === 0) {
      throw new Error('No qualifying vendors found across all categories')
    }

    logs.push(`Total selected: ${selectedVendorIds.length} vendors`)

    // Step 3: Update zipp_highlights table
    const { error: updateError } = await supabase
      .from('zipp_highlights')
      .upsert({
        singleton_key: 'singleton',
        vendor_ids: selectedVendorIds,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'singleton_key' })

    if (updateError) throw updateError

    logs.push('✅ Zipp Highlights updated successfully!')

    return new Response(
      JSON.stringify({ success: true, vendorCount: selectedVendorIds.length, vendorIds: selectedVendorIds, logs }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    logs.push(`❌ ERROR: ${error.message}`)
    return new Response(
      JSON.stringify({ success: false, message: error.message, logs }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
