
import { MetadataRoute } from 'next';
import { getAdminApp } from '@/lib/firebase-admin';
import type { Vendor } from '@/lib/types';

export const revalidate = 604800; // Revalidate once per week (in seconds)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zipp.sg';

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
    const adminApp = getAdminApp();
    const db = adminApp.firestore();
    
    // NOTE: Using the Admin SDK query style
    const vendorSnapshot = await db.collection('vendors').get();
    
    vendorRoutes = vendorSnapshot.docs.map((doc) => {
      const vendor = doc.data() as Vendor;
      
      // Admin SDK Timestamps are different from Client SDK
      // They have a .toDate() method
      const lastModified = vendor.updatedAt && typeof (vendor.updatedAt as any).toDate === 'function'
        ? (vendor.updatedAt as any).toDate().toISOString()
        : new Date().toISOString();

      return {
        url: `${baseUrl}/vendor/${doc.id}`,
        lastModified: lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });
  } catch (error) {
    console.error("Failed to generate vendor routes for sitemap:", error);
  }

  return [...staticRoutes, ...vendorRoutes];
}
