import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown, PiggyBank } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton, FavoriteButtonSkeleton } from "@/features/account/components/FavoriteButton";
import { cartEnabled } from "@/features/cart/lib/flag";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { MarketPricesModal } from "@/features/product/components/MarketPricesModal";
import { ViewBeacon } from "@/features/events/components/ViewBeacon";
import { productJsonLd } from "@/features/product/lib/jsonld";
import { loadProduct } from "@/features/product/server/load";
import { productMetadata } from "@/features/product/lib/metadata";
import { ProductGallery } from "@/features/product/components/ProductGallery";
import { ShareButton } from "@/features/product/components/ShareButton";
import { ProductCard } from "@/features/search/components/ProductCard";
import { breadcrumbListJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { listCategories, listSitemap, searchProducts, getProductOffers } from "@/lib/marketplace/client";
import type { CategoryNode, ProductDetail } from "@/lib/marketplace/schemas";
import { getEffectiveLocation } from "@/features/location/server/location";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import { formatUsd, formatVes } from "@/lib/format";

const RESTRICTED_NOTE = {
  recipe: "Requiere récipe.",
  controlled: "Venta controlada.",
} as const;

type Params = Promise<{ slug: string }>;

const STATIC_PRODUCT_COUNT = 20;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const { data } = await listSitemap({ type: "products", page: 1 });
  const params = data.slice(0, STATIC_PRODUCT_COUNT).map((entry) => ({ slug: entry.slug }));
  return params.length > 0 ? params : [{ slug: "__vacio" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return productMetadata((await loadProduct(slug)).data);
}

function findCategory(nodes: CategoryNode[], slug: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const found = findCategory(node.children, slug);
    if (found !== null) return found;
  }
  return null;
}

async function categoryTrail(product: ProductDetail): Promise<{ slug: string; name: string }[]> {
  const category = product.category;
  if (category === null) return [];
  const trail: { slug: string; name: string }[] = [];
  if (category.parent_slug !== null) {
    const parent = findCategory(await listCategories(), category.parent_slug);
    if (parent !== null) trail.push({ slug: parent.slug, name: parent.name });
  }
  trail.push({ slug: category.slug, name: category.name });
  return trail;
}

function JsonLdScript({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
  );
}

async function ProductBuyBox({ product }: { product: ProductDetail }) {
  const { location } = await getEffectiveLocation();
  const geo = toGeoFilter(location);
  const response = await getProductOffers({
    slug: product.slug,
    geo,
    radiusKm: geo ? DEFAULT_RADIUS_KM : null,
    sort: "price",
  });

  const page = response === null || "redirect_to" in response ? null : response;
  const offers = page !== null ? page.offers : [];
  const bestOffer = offers.length > 0 ? offers[0] : null;
  const offersCount = offers.length;

  return (
    <div className="flex flex-col gap-4 mt-2">
      {bestOffer ? (
        <>
          <div className="flex flex-col gap-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-text mb-1">Desde</p>
                <p className="font-heading text-4xl font-extrabold text-foreground leading-none">{formatUsd(bestOffer.price_usd)}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">{formatVes(bestOffer.price_ves)}</p>
              </div>
              <Badge variant="success">En inventario</Badge>
            </div>
            {cartEnabled() && product.restriction === "none" && (
              <AddToCartButton
                storeSlug={bestOffer.store.slug}
                storeName="Comercio Aliado"
                productSlug={product.slug}
                productName={product.name}
                variant="default"
                size="lg"
                className="w-full mt-2"
              />
            )}
          </div>

          <div className="mt-2 flex flex-col gap-4">
            <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="bg-primary/10 p-2 rounded-full">
                <PiggyBank className="w-6 h-6 text-primary-text" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">
                  Este producto está disponible en <span className="text-primary-text underline decoration-primary/30 underline-offset-2">{offersCount} farmacias</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vamos a cotizar por ti en todas ellas y elegiremos la opción más barata para llevarla a tu casa.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 p-4 bg-card rounded-xl border border-border shadow-sm text-center">
              <h4 className="font-bold text-foreground text-sm">Precios de mercado para este medicamento</h4>
              <div className="flex w-full justify-between px-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Mínimo</span>
                  <span className="font-bold text-sm text-foreground">{formatUsd(product.offers_summary.low_price_usd ?? bestOffer.price_usd)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Máximo</span>
                  <span className="font-bold text-sm text-foreground">{formatUsd(product.offers_summary.high_price_usd ?? bestOffer.price_usd)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Farmacias</span>
                  <span className="font-bold text-sm text-foreground">{offersCount}</span>
                </div>
              </div>
              <div className="mt-2">
                <MarketPricesModal offers={offers} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="pt-4 border-t border-border">
          <p className="text-muted-foreground text-sm">Sin disponibilidad en este momento para tu zona.</p>
        </div>
      )}
    </div>
  );
}

async function RelatedProducts({ categorySlug, title }: { categorySlug: string | null, title: string }) {
  const { location } = await getEffectiveLocation();
  const geo = toGeoFilter(location);
  const { data } = await searchProducts({
    q: "",
    category: categorySlug,
    geo,
    radiusKm: geo ? DEFAULT_RADIUS_KM : null,
    page: 1,
  });

  if (data.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">{title}</h2>
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

export default async function ProductPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const { data: product } = await loadProduct(slug);
  const trail = await categoryTrail(product);
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: product.name, path: `/p/${product.slug}` },
  ];

  return (
    <article className="flex flex-col gap-10">
      <JsonLdScript data={productJsonLd(product)} />
      <JsonLdScript data={breadcrumbListJsonLd(crumbs)} />
      <ViewBeacon event={{ type: "product_view", store_slug: null, product_slug: slug }} />
      <nav aria-label="Migas de pan">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-1">
            <Link
              href="/"
              className="hover:text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Inicio
            </Link>
          </li>
          {trail.map((category) => (
            <li key={category.slug} className="flex items-center gap-1">
              <span aria-hidden="true">›</span>
              <span>{category.name}</span>
            </li>
          ))}
        </ol>
      </nav>
      
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="sticky top-20">
          <ProductGallery 
            images={[
              product.image_url,
              // Mocks temporales para demostrar la funcionalidad de 1 a 5 imágenes solicitada:
              product.image_url, 
              product.image_url
            ].filter((url): url is string => url !== null)}
            alt={product.name}
          />
        </div>
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden border-border shadow-md">
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  {product.brand !== null && (
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {product.brand}
                    </span>
                  )}
                  <h1 className="font-heading text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl leading-tight">
                    {product.name}
                  </h1>
                  {product.category !== null && (
                    <Badge variant="secondary" className="w-fit mt-1 bg-secondary/50 text-secondary-foreground/80 hover:bg-secondary/70 transition-colors">
                      {product.category.name}
                    </Badge>
                  )}
                </div>
                <div className="shrink-0 mt-1 flex flex-col gap-2">
                  <Suspense fallback={<FavoriteButtonSkeleton />}>
                    <FavoriteButton target={{ kind: "product", slug: product.slug }} returnTo={`/p/${product.slug}`} />
                  </Suspense>
                  <ShareButton title={product.name} text={`Mira este producto: ${product.name}`} />
                </div>
              </div>
              
              {product.restriction === "recipe" && <Badge variant="warning" className="w-fit">Requiere récipe</Badge>}
              {cartEnabled() && product.restriction !== "none" && (
                <p className="text-sm font-medium text-warning">{RESTRICTED_NOTE[product.restriction]}</p>
              )}

              <Suspense fallback={<div className="h-24 w-full bg-muted/20 animate-pulse rounded-md mt-4"></div>}>
                <ProductBuyBox product={product} />
              </Suspense>
            </CardContent>
          </Card>

          {/* Información Adicional con Acordeón (details/summary) */}
          {product.attributes.length > 0 && (
            <Card className="overflow-hidden border-border shadow-sm">
              <CardContent className="p-0">
                <h3 className="font-heading font-bold text-lg p-5 border-b border-border bg-muted/10">Información Adicional</h3>
                <div className="flex flex-col divide-y divide-border">
                  {product.attributes.map((attribute) => (
                    <details key={attribute.name} className="group">
                      <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-medium text-foreground hover:bg-muted/10 focus-visible:outline-none focus-visible:bg-muted/20 list-none [&::-webkit-details-marker]:hidden">
                        {attribute.name}
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                      </summary>
                      <div className="p-5 pt-0 text-sm text-muted-foreground leading-relaxed bg-muted/5">
                        {attribute.value}
                      </div>
                    </details>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-12 mt-8">
        <Suspense fallback={<div className="h-64 bg-muted/20 animate-pulse rounded-xl"></div>}>
          <RelatedProducts categorySlug={product.category?.slug ?? null} title="Cómpralos juntos" />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-muted/20 animate-pulse rounded-xl"></div>}>
          <RelatedProducts categorySlug={null} title="También vistos por otros clientes" />
        </Suspense>
      </div>
    </article>
  );
}
