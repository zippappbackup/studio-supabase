
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Vendor, GooglePhoto } from "@/lib/types";
import { PlaceholderImages } from "@/lib/placeholder-images";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A robust, centralized function to get a vendor's logo URL.
 * It now correctly uses the server-side proxy for Google Photos and
 * falls back to category-specific icons if no image is available.
 *
 * @param vendor The vendor object.
 * @returns A string containing a valid image URL.
 */
export const getLogoUrl = (vendor: Partial<Vendor>): string => {
  // 1. Prefer the explicit logoUrl if it's a valid string.
  if (typeof vendor.logoUrl === 'string' && vendor.logoUrl.trim() !== '') {
    return vendor.logoUrl;
  }

  // 2. Check the photos array for the first available image.
  if (Array.isArray(vendor.photos) && vendor.photos.length > 0) {
    const firstPhoto = vendor.photos[0];
    if (typeof firstPhoto === 'string' && firstPhoto.trim() !== '') {
      return firstPhoto;
    }
    if (typeof firstPhoto === 'object' && firstPhoto !== null && 'photo_reference' in firstPhoto) {
       const photoRef = (firstPhoto as GooglePhoto).photo_reference;
       if(typeof photoRef === 'string' && photoRef.trim() !== '') {
         return `https://us-central1-studio-7004719050-b856d.cloudfunctions.net/placePhotoProxy?ref=${encodeURIComponent(photoRef)}`;
       }
    }
  }
  
  // 3. NEW: Fallback to category-specific icon if no logo or photo exists.
  const icons: { [key: string]: string } = {
    'car care': '/icons/car care.svg',
    'cleaning services': '/icons/cleaning services.svg',
    'handyman services': '/icons/handyman services.svg',
    'mobile device repair': '/icons/mobile device repair.svg',
  };
  if (vendor.categoryId && icons[vendor.categoryId.toLowerCase()]) {
      return icons[vendor.categoryId.toLowerCase()];
  }

  // 4. Final fallback to the generic placeholder.
  return PlaceholderImages['vendor-logo-placeholder'].imageUrl;
};

