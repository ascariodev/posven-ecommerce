import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FavoriteButton, FavoriteButtonSkeleton } from "@/features/account/components/FavoriteButton";
import { ViewBeacon } from "@/features/events/components/ViewBeacon";
import { storeJsonLd } from "@/features/store/lib/jsonld";
import { StoreHeader } from "@/features/store/components/StoreHeader";
import { StoreProducts, StoreProductsSkeleton } from "@/features/store/components/StoreProducts";
import { serializeJsonLd } from "@/lib/jsonld";
import { getStore, listSitemap } from "@/lib/marketplace/client";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATIC_STORE_COUNT = 20;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const { data } = await listSitemap({ type: "stores", page: 1 });
  const params = data.slice(0, STATIC_STORE_COUNT).map((entry) => ({ slug: entry.slug }));
  return params.length > 0 ? params : [{ slug: "__vacio" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const response = await getStore({ slug, page: 1 });
  if (response === null) notFound();
  const store = response.data;
  const metadata: Metadata = {
    title: store.name,
    description: `${store.name} en ${store.city.name}: dirección, horario, contacto y productos.`,
    alternates: { canonical: `/tienda/${store.slug}` },
  };
  if (store.logo_url !== null) metadata.openGraph = { images: [store.logo_url] };
  return metadata;
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const response = await getStore({ slug, page: 1 });
  if (response === null) notFound();
  const store = response.data;

  return (
    <article className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(storeJsonLd(store)) }}
      />
      <ViewBeacon event={{ type: "store_view", store_slug: slug, product_slug: null }} />
      <StoreHeader store={store}>
        <Suspense fallback={<FavoriteButtonSkeleton />}>
          <FavoriteButton target={{ kind: "store", slug }} returnTo={`/tienda/${slug}`} />
        </Suspense>
      </StoreHeader>
      <Suspense fallback={<StoreProductsSkeleton />}>
        <StoreProducts slug={slug} searchParams={searchParams} />
      </Suspense>
    </article>
  );
}
