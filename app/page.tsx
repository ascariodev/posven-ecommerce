import type { Metadata } from "next";
import { Suspense } from "react";
import { LocationBar, LocationBarSkeleton } from "@/features/location/LocationBar";
import { CategoryLinks } from "@/features/search/CategoryLinks";
import { SearchForm } from "@/features/search/SearchForm";
import { NearbyStores, NearbyStoresSkeleton } from "@/features/store/NearbyStores";
import { listCategories } from "@/lib/marketplace/client";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const categories = await listCategories();
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Encuentra lo que buscas en tiendas cerca de ti
        </h1>
        <p className="text-lg text-muted-foreground">{SITE_DESCRIPTION}</p>
        <SearchForm />
        <Suspense fallback={<LocationBarSkeleton />}>
          <LocationBar />
        </Suspense>
      </section>
      <section aria-labelledby="categories-title" className="flex flex-col gap-3">
        <h2 id="categories-title" className="text-lg font-semibold text-foreground">
          Categorías
        </h2>
        <CategoryLinks categories={categories} />
      </section>
      <Suspense fallback={<NearbyStoresSkeleton />}>
        <NearbyStores />
      </Suspense>
    </div>
  );
}
