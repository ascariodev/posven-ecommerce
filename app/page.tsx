import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryTiles } from "@/features/search/components/CategoryTiles";
import { NearbyProducts, NearbyProductsSkeleton } from "@/features/search/components/NearbyProducts";
import { SearchPill } from "@/features/search/components/SearchPill";
import { searchHref } from "@/features/search/lib/query";
import { HowItWorks } from "@/features/site/components/HowItWorks";
import { SellBanner } from "@/features/site/components/SellBanner";
import { TrustStrip } from "@/features/site/components/TrustStrip";
import { NearbyStores, NearbyStoresSkeleton } from "@/features/store/components/NearbyStores";
import { listCategories } from "@/lib/marketplace/client";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const PROMO_IMAGES: Record<string, string> = {
  "salud-y-medicamentos": "/brand/promo-salud.jpg",
  alimentos: "/brand/promo-alimentos.jpg",
};

export default async function Home() {
  const categories = await listCategories();
  const promos = categories.filter((category) => category.slug in PROMO_IMAGES).slice(0, 2);
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section className="relative flex min-h-[26rem] flex-col justify-center gap-6 overflow-hidden rounded-3xl bg-ink p-6 text-ink-foreground sm:p-10 md:rounded-4xl">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-3/5 sm:block">
          <Image
            src="/brand/hero.jpg"
            alt=""
            fill
            preload
            sizes="(min-width: 1024px) 620px, 60vw"
            className="object-cover object-right [mask-image:linear-gradient(to_right,transparent,black_35%)]"
          />
        </div>
        <div className="relative flex flex-col gap-4 sm:max-w-[52%]">
          <span className="w-fit rounded-full border border-primary/60 px-3 py-1 text-xs font-semibold text-primary">
            Compara precios antes de salir
          </span>
          <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Encuentra lo que necesitas al <span className="text-primary">mejor precio</span> cerca de ti
          </h1>
          <p className="text-base opacity-85">Compara precios en dólares y bolívares en las tiendas de tu zona.</p>
          <SearchPill />
        </div>
      </section>
      <TrustStrip />
      {promos.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {promos.map((category) => (
            <li key={category.slug} className="flex">
              <Link
                href={searchHref({ q: "", categoria: category.slug, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
                className="relative flex min-h-44 w-full flex-col justify-center gap-2 overflow-hidden rounded-3xl bg-ink p-6 text-ink-foreground transition-shadow hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
              >
                <Image
                  src={PROMO_IMAGES[category.slug]}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover object-right [mask-image:linear-gradient(to_right,transparent_20%,black_65%)]"
                />
                <span className="relative text-xs font-semibold text-primary">Ofertas cerca de ti</span>
                <span className="relative max-w-[55%] font-heading text-xl leading-tight font-semibold">{category.name}</span>
                <span className="relative w-fit rounded-lg bg-card px-4 py-2 text-sm font-semibold text-foreground">
                  Ver ofertas
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <CategoryTiles categories={categories} />
      <Suspense fallback={<NearbyProductsSkeleton />}>
        <NearbyProducts />
      </Suspense>
      <HowItWorks />
      <Suspense fallback={<NearbyStoresSkeleton />}>
        <NearbyStores />
      </Suspense>
      <SellBanner />
    </div>
  );
}
