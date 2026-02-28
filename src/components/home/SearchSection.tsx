
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchSection() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?keyword=${encodeURIComponent(query)}`);
  };

  return (
    <div className="pt-4 px-4 sm:px-6 md:px-8">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleQueryChange}
          placeholder="Search for Services"
          className="h-14 rounded-lg pl-12 pr-28 text-base border-border focus-visible:ring-blue-400"
        />
        <Button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-6"
          size="lg"
        >
          Search
        </Button>
      </form>
    </div>
  );
}
