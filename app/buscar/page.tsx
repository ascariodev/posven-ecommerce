import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { parseSearchQuery } from "@/features/search/query";
import { SearchPill } from "@/features/search/SearchPill";
import { SearchResults } from "@/features/search/SearchResults";

export const metadata: Metadata = {
  title: "Buscar",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function SearchPillWithQuery({ searchParams }: { searchParams: SearchParams }) {
  const { q } = parseSearchQuery(await searchParams);
  return <SearchPill defaultQuery={q} compact />;
}

function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="aspect-[4/3]" />
      ))}
    </div>
  );
}

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Buscar productos</h1>
      <Suspense fallback={<SearchPill compact />}>
        <SearchPillWithQuery searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
