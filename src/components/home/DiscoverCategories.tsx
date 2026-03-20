'use client';

import * as React from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useAppCache } from '@/context/AppCacheProvider';
import { Separator } from '@/components/ui/separator';

export function DiscoverCategories() {
  const { categories, isVendorDataReady: isAppCacheReady } = useAppCache();

  const icons: { [key: string]: string } = {
    'car care': '/icons/car-care.svg',
    'cleaning services': '/icons/cleaning-services.svg',
    'handyman services': '/icons/handyman-services.svg',
    'mobile device repair': '/icons/mobile-device-repair.svg',
    'default': '/icons/Explore.svg',
  };

  if (!isAppCacheReady) {
    return (
      <div className="pt-4 px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="h-3 w-10 rounded-md bg-muted" />
              </div>
            ))}
          </div>
           <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} className="mt-4" />
      </div>
    );
  }

  return (
    <div className="pt-4 px-4 sm:px-6 md:px-8">
      <div className="grid grid-cols-4 gap-4">
        {(categories || []).map((category) => {
          // Normalize the ID received from the cache (e.g., 'car-care' -> 'car care')
          const normalizedId = category.id.replace(/-/g, ' ');
          const IconUrl = icons[normalizedId.toLowerCase()] || icons.default;
          
          return (
            <Link
              key={category.id}
              href={`/search?category=${encodeURIComponent(category.id)}`}
              className="group"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors">
                  <Image 
                    src={IconUrl} 
                    alt={category.name} 
                    width={20} 
                    height={20} 
                    className="h-5 w-5 filter-primary-foreground" 
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground transition-colors" style={{ fontSize: '98%' }}>
                  {category.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} className="mt-4" />
      <style jsx global>{`
        .filter-primary-foreground {
          filter: invert(15%) sepia(21%) saturate(1455%) hue-rotate(174deg) brightness(97%) contrast(91%);
        }
      `}</style>
    </div>
  );
}
