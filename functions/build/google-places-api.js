"use strict";
/**
 * @fileoverview Full implementation for querying Google Places API with Place Details.
 * This has been refactored to separate Text Search from Place Details fetching
 * to support a more granular vendor-level caching strategy.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPlaceDetails = fetchPlaceDetails;
exports.searchPlacesByKeyword = searchPlacesByKeyword;
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const client = new google_maps_services_js_1.Client({});
const categoryQueryMap = {
    'car-cleaning': {
        types: ['car_wash', 'car_repair'],
        keywords: [
            'car cleaning',
            'auto detailing',
            'car wash',
            'car grooming',
            'vehicle detailing',
            'car polish'
        ],
    },
    'cleaning': {
        types: ['establishment'],
        keywords: [
            'house cleaning',
            'office cleaning',
            'disinfection service',
            'maid service',
            'housekeeping',
            'janitorial service'
        ],
    },
    'handyman': {
        types: ['plumber', 'electrician', 'locksmith', 'home_goods_store'],
        keywords: [
            'handyman',
            'home repair',
            'plumbing service',
            'electrical repair',
            'locksmith',
            'electrician',
            'AC repair',
            'aircon service',
            'furniture assembly',
            'appliance repair'
        ],
    },
    'mobile-repair': {
        types: ['electronics_store'],
        keywords: [
            'mobile repair',
            'phone repair',
            'screen replacement',
            'iPhone repair',
            'Samsung repair',
            'tablet repair',
            'mobile accessories',
            'smartphone repair'
        ],
    },
};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function normalizeNameForLookup(name) {
    if (!name)
        return '';
    return name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Fetches the full details for a single place from Google Places API.
 * This version is defensive and ensures no `undefined` values are returned.
 * @param placeId The Google Place ID to fetch details for.
 * @param apiKey Your Google Places API key.
 * @returns A promise that resolves to the detailed place object or null.
 */
async function fetchPlaceDetails(placeId, apiKey) {
    const detailsParams = {
        place_id: placeId,
        fields: [
            "name", "formatted_address", "geometry", "place_id",
            "formatted_phone_number", "website", "opening_hours",
            "photos", "price_level", "types", "rating",
            "user_ratings_total", "review", "business_status"
        ],
        key: apiKey,
    };
    try {
        const response = await client.placeDetails({ params: detailsParams });
        const placeDetails = response.data.result;
        if (!placeDetails) {
            console.error(`[DETAILS API] No result found for placeId: ${placeId}`);
            return null;
        }
        const photoUrls = (placeDetails.photos || []).map((photo) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`);
        // Defensive data transformation to prevent undefined values.
        // Every field is checked and provided with a safe fallback.
        return {
            googlePlaceId: placeDetails.place_id ?? null,
            name: placeDetails.name ?? 'Unknown Business',
            normalizedName: normalizeNameForLookup(placeDetails.name || ''),
            address: placeDetails.formatted_address ?? null,
            lat: placeDetails.geometry?.location?.lat ?? null,
            lng: placeDetails.geometry?.location?.lng ?? null,
            googleRating: placeDetails.rating ?? 0,
            googleReviewCount: placeDetails.user_ratings_total ?? 0,
            phone: placeDetails.formatted_phone_number || null,
            website: placeDetails.website || null,
            operatingHours: placeDetails.opening_hours?.weekday_text || null,
            photos: photoUrls,
            priceLevel: placeDetails.price_level ?? null,
            types: placeDetails.types || [],
            reviews: placeDetails.reviews || [],
            businessStatus: placeDetails.business_status || null,
            region: 'Singapore' // Hardcoded as per business logic
        };
    }
    catch (error) {
        console.error(`[DETAILS API] Error fetching details for ${placeId}: ${error.message}`);
        return null; // Return null to indicate failure
    }
}
/**
 * Performs a Text Search to get a list of basic business information.
 * This function no longer fetches full details.
 * @param categoryId The internal category ID.
 * @param isLimitEnabled A boolean to enable or disable the vendor limit.
 * @param vendorLimit The maximum number of vendors to fetch.
 * @returns A promise that resolves to an array of basic vendor data.
 */
async function searchPlacesByKeyword(categoryId, isLimitEnabled = false, vendorLimit = 20) {
    const apiKey = process.env.PLACES_KEY;
    if (!apiKey) {
        console.error("CRITICAL: Google Places API key (PLACES_KEY) is missing!");
        return [];
    }
    const SINGAPORE_CENTER = "1.3521,103.8198";
    const SINGAPORE_RADIUS = "22000";
    const queryConfig = categoryQueryMap[categoryId] || { types: ['establishment'], keywords: [categoryId.replace(/-/g, ' ')] };
    const allResults = new Map();
    const MAX_PAGES = 3;
    console.log(`[LIVE SEARCH] Starting search for category: ${categoryId}. Limit enabled: ${isLimitEnabled}, Limit: ${vendorLimit}`);
    search_loop: for (const keyword of queryConfig.keywords) {
        for (const type of queryConfig.types) {
            let nextPageToken = null;
            let pageCount = 0;
            do {
                if (isLimitEnabled && allResults.size >= vendorLimit)
                    break search_loop;
                pageCount++;
                const searchParams = {
                    query: keyword,
                    location: SINGAPORE_CENTER,
                    radius: parseInt(SINGAPORE_RADIUS),
                    type: type, // Cast to any to satisfy the SDK's stricter enum typing
                    key: apiKey,
                    pagetoken: nextPageToken || undefined
                };
                try {
                    const response = await client.textSearch({ params: searchParams });
                    const data = response.data;
                    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                        console.error(`[LIVE SEARCH] API Error for "${keyword}": ${data.status}`);
                        break;
                    }
                    if (data.results) {
                        for (const result of data.results) {
                            if (!result.formatted_address?.toLowerCase().includes('singapore'))
                                continue;
                            if (isLimitEnabled && allResults.size >= vendorLimit)
                                break search_loop;
                            if (result.place_id && !allResults.has(result.place_id)) {
                                allResults.set(result.place_id, {
                                    googlePlaceId: result.place_id,
                                    name: result.name,
                                });
                            }
                        }
                    }
                    nextPageToken = data.next_page_token || null;
                    if (nextPageToken)
                        await delay(2000);
                }
                catch (error) {
                    console.error(`[LIVE SEARCH] Network error for "${keyword}": ${error.message}`);
                    nextPageToken = null;
                }
            } while (nextPageToken && pageCount < MAX_PAGES);
        }
    }
    const finalResults = Array.from(allResults.values());
    console.log(`[LIVE SEARCH] Completed initial search. Found ${finalResults.length} unique potential vendors.`);
    return finalResults;
}
//# sourceMappingURL=google-places-api.js.map