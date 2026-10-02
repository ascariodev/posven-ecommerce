import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { Banknote, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryRail } from "@/features/search/components/CategoryRail";
import { SearchPill } from "@/features/search/components/SearchPill";
import { NearbyStores, NearbyStoresSkeleton } from "@/features/store/components/NearbyStores";
import { listCategories, searchProducts } from "@/lib/marketplace/client";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { getEffectiveLocation } from "@/features/location/server/location";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import { ProductCard } from "@/features/search/components/ProductCard";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

async function FeaturedProducts() {
  const { location } = await getEffectiveLocation();
  const geo = toGeoFilter(location);
  const { data } = await searchProducts({
    q: "",
    category: null,
    geo,
    radiusKm: geo ? DEFAULT_RADIUS_KM : null,
    page: 1,
  });

  if (data.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 mt-6 mx-auto w-full max-w-5xl px-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">Lo Más Destacado</h2>
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data.slice(0, 5).map((item) => (
          <li key={item.slug}>
            <ProductCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>
  );
}

export default async function Home() {
  const categories = await listCategories();
  return (
    <div className="flex flex-col gap-8 pb-12 sm:gap-12">
      {/* 1. HERO SECTION (Farmatodo Style: Yellow Background, Full Bleed Feel) */}
      <div className="relative -mt-8 pt-8 bg-secondary pb-24 sm:pb-32 w-screen left-1/2 -translate-x-1/2">
        <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 md:flex-row">
          <div className="flex flex-1 flex-col gap-6 pt-8">
            <Badge className="w-fit border-none bg-primary text-primary-foreground shadow-sm">
              Tu farmacia y supermercado
            </Badge>
            <h1 className="font-heading text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Lo que necesitas, <span className="text-primary">al mejor precio</span>
            </h1>
            <p className="max-w-xl text-lg text-secondary-foreground font-medium">
              Encuentra miles de productos cerca de ti. Compara precios en dólares y bolívares antes de salir o pide a domicilio.
            </p>
            <div className="mt-4 w-full max-w-xl">
              <SearchPill />
            </div>
          </div>
          <div className="flex w-full flex-1 justify-center drop-shadow-2xl">
            <Image
              src="/hero_shopping.jpg"
              alt="Hero Shopping"
              width={500}
              height={500}
              className="w-full max-w-sm rounded-3xl object-cover mix-blend-multiply dark:mix-blend-normal"
              priority
            />
          </div>
        </section>
      </div>

      {/* 2. VALUE PROPOSITION (Overlapping the hero section) */}
      <section className="mx-auto -mt-16 sm:-mt-24 w-full max-w-5xl px-4 relative z-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl bg-card p-6 shadow-md border border-border">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground">Delivery Exprés</h3>
              <p className="text-sm text-muted-foreground">Recibe directo en tu ubicación</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-card p-6 shadow-md border border-border">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-best/10 text-best">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground">Ahorro Inteligente</h3>
              <p className="text-sm text-muted-foreground">Paga menos en Bs y USD</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-card p-6 shadow-md border border-border">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground">Compra Protegida</h3>
              <p className="text-sm text-muted-foreground">100% de garantía en pagos</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY RAIL (Farmatodo Style: Stories / Circles) */}
      <section className="flex flex-col gap-4 mt-4 mx-auto w-full max-w-5xl px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">Categorías Principales</h2>
        </div>
        <CategoryRail categories={categories} />
      </section>

      {/* 4. FEATURED PRODUCTS (Ofertas / Lo más vendido) */}
      <Suspense fallback={<ProductSkeleton />}>
        <FeaturedProducts />
      </Suspense>

      {/* 5. PROMO BANNER */}
      <section className="group relative overflow-hidden rounded-2xl mx-auto w-full max-w-5xl px-4 mt-6">
        <div className="relative aspect-[21/9] w-full md:aspect-[32/9] rounded-2xl overflow-hidden shadow-md border border-border">
          <Image
            src="/promo_banner.jpg"
            alt="Promoción Especial"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/80 via-black/50 to-transparent p-8 sm:p-12">
            <Badge className="mb-4 w-fit border-none bg-accent text-accent-foreground">
              Súper Ofertas
            </Badge>
            <h2 className="max-w-lg font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Todo para el cuidado de tu familia
            </h2>
            <p className="mt-2 max-w-md text-slate-200">
              Revisa nuestras promociones semanales exclusivas en salud y bienestar.
            </p>
          </div>
        </div>
      </section>

      {/* 6. NEARBY STORES */}
      <section className="flex flex-col gap-6 mx-auto w-full max-w-5xl px-4 mt-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">Comercios Cerca de Ti</h2>
          <p className="text-muted-foreground">Explora el inventario de las tiendas de tu zona listas para atenderte.</p>
        </div>
        <Suspense fallback={<NearbyStoresSkeleton />}>
          <NearbyStores />
        </Suspense>
      </section>
    </div>
  );
}
