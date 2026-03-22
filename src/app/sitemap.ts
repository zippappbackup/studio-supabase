import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 604800; // Revalidate once per week

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://studio-supabase.pages.dev';

  // 1. Static Pages
  const staticRoutes = ['/welcome', '/home', '/search', '/login', '/signup', '/partners', '/about', '/contact'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '/welcome' ? 1.0 : 0.8,
  }));

  // 2. Dynamic Vendor Pages
  let vendorRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: vendors } = await supabase
      .from('vendors')
      .select('vendor_id, updated_at')
      .eq('subscription_status', 'pending_verification')
      .limit(2000);

    if (vendors) {
      vendorRoutes = vendors.map((vendor) => ({
        url: `${baseUrl}/vendor/${vendor.vendor_id}`,
        lastModified: vendor.updated_at ? new Date(vendor.updated_at).toISOString() : new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Failed to generate vendor routes for sitemap:', error);
  }

  return [...staticRoutes, ...vendorRoutes];
}
