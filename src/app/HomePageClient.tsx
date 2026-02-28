"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * This component's only job is to display a loading skeleton.
 * All routing logic has been moved to RootRedirector.tsx to prevent
 * race conditions and flashes of incorrect content.
 */
export default function HomePageClient() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  );
}
