import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryRail } from "@/features/search/CategoryRail";
import { SearchPill } from "@/features/search/SearchPill";
import { NearbyStores, NearbyStoresSkeleton } from "@/features/store/NearbyStores";
import { listCategories } from "@/lib/marketplace/client";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const categories = await listCategories();
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4 py-6 sm:py-10">
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
          Encuentra lo que buscas en tiendas cerca de ti
        </h1>
        <p className="text-lg text-muted-foreground">Compara precios en dólares y bolívares antes de salir.</p>
        <SearchPill />
      </section>
      <CategoryRail categories={categories} />
      <Suspense fallback={<NearbyStoresSkeleton />}>
        <NearbyStores />
      </Suspense>
    </div>
  );
}
