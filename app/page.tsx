import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryRail } from "@/features/search/components/CategoryRail";
import { NearbyProducts, NearbyProductsSkeleton } from "@/features/search/components/NearbyProducts";
import { SearchPill } from "@/features/search/components/SearchPill";
import { NearbyStores, NearbyStoresSkeleton } from "@/features/store/components/NearbyStores";
import { listCategories } from "@/lib/marketplace/client";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const categories = await listCategories();
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <section className="relative flex flex-col gap-6 rounded-3xl bg-primary p-6 text-primary-foreground sm:gap-8 sm:p-10 md:rounded-4xl">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -top-16 -right-16 size-72 rounded-full border-[48px] border-primary-foreground/10" />
        </div>
        <div className="relative flex max-w-2xl flex-col gap-4">
          <span className="w-fit rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold">
            Compara precios antes de salir
          </span>
          <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Encuentra lo que necesitas al mejor precio cerca de ti
          </h1>
          <p className="text-base">Compara precios en dólares y bolívares en las tiendas de tu zona.</p>
        </div>
        <div className="relative">
          <SearchPill />
        </div>
      </section>
      <CategoryRail categories={categories} />
      <Suspense fallback={<NearbyProductsSkeleton />}>
        <NearbyProducts />
      </Suspense>
      <Suspense fallback={<NearbyStoresSkeleton />}>
        <NearbyStores />
      </Suspense>
    </div>
  );
}
