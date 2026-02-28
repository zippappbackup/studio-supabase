import { Skeleton } from '@/components/ui/skeleton';

export function HomePageSkeleton() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Search Section Skeleton */}
      <Skeleton className="h-14 w-full rounded-lg" />

      {/* Categories Skeleton */}
      <div className="mb-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-3 w-10 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Zipp Highlights Skeleton */}
      <div className="mb-12">
        <Skeleton className="h-8 w-48 mb-4 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
