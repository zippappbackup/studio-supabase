import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const SearchResultsPageClient = dynamic(
  () => import('./SearchResultsPageClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Search...</p>
        </div>
      </div>
    ),
  }
);

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-6">
      <SearchResultsPageClient />
    </div>
  );
}
