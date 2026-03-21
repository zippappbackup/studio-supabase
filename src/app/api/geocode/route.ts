export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return Response.json({ success: false, error: 'Address is required' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&countrycodes=sg&limit=1`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Zipp-Super-App/1.0 (hello@zipp.com)' }
    });

    if (!response.ok) {
      return Response.json({ success: false, error: `Geocoding service error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json() as any[];

    if (data && data.length > 0) {
      const { lat, lon, display_name } = data[0];
      const isLandmark = display_name.split(',').length < 4;
      return Response.json({
        success: true,
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        address: display_name,
        isLandmark,
      });
    }

    return Response.json({
      success: false,
      error: `Could not find a location for "${address}". Please try a more specific address.`
    });

  } catch (error: any) {
    return Response.json({ success: false, error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}
