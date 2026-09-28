import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationBar, LocationBarSkeleton } from "@/features/location/LocationBar";
import { parseSearchQuery } from "@/features/search/query";
import { SearchForm } from "@/features/search/SearchForm";
import { SearchResults } from "@/features/search/SearchResults";

export const metadata: Metadata = {
  title: "Buscar",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function SearchFormWithQuery({ searchParams }: { searchParams: SearchParams }) {
  const { q } = parseSearchQuery(await searchParams);
  return <SearchForm defaultQuery={q} />;
}

function SearchResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-32" />
      ))}
    </div>
  );
}

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Buscar productos</h1>
      <Suspense fallback={<SearchForm />}>
        <SearchFormWithQuery searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<LocationBarSkeleton />}>
        <LocationBar />
      </Suspense>
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
