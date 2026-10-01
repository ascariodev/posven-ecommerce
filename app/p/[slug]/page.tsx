import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton, FavoriteButtonSkeleton } from "@/features/account/FavoriteButton";
import { cartEnabled } from "@/features/cart/lib/flag";
import { ViewBeacon } from "@/features/events/ViewBeacon";
import { productJsonLd } from "@/features/product/jsonld";
import { loadProduct } from "@/features/product/load";
import { productMetadata } from "@/features/product/metadata";
import { PriceSummary } from "@/features/product/PriceSummary";
import { ProductOffers, ProductOffersSkeleton } from "@/features/product/ProductOffers";
import { ProductThumb } from "@/features/search/ProductThumb";
import { breadcrumbListJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { listCategories, listSitemap } from "@/lib/marketplace/client";
import type { CategoryNode, ProductDetail } from "@/lib/marketplace/schemas";

// Productos que no se venden en línea (enmienda E de cuentas-y-compras): sin botón de agregar.
const RESTRICTED_NOTE = {
  recipe: "Requiere récipe, consúltalo en la tienda.",
  controlled: "Venta controlada, consúltalo en la tienda.",
} as const;

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { data: product } = await loadProduct(slug);
  const trail = await categoryTrail(product);
  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: product.name, path: `/p/${product.slug}` },
  ];

  return (
    <article className="flex flex-col gap-6">
      <JsonLdScript data={productJsonLd(product)} />
      <JsonLdScript data={breadcrumbListJsonLd(crumbs)} />
      <ViewBeacon event={{ type: "product_view", store_slug: null, product_slug: slug }} />
      <nav aria-label="Migas de pan">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-1">
            <Link
              href="/"
              className="hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
        <ProductThumb
          imageUrl={product.image_url}
          category={product.category}
          size="detail"
          alt={product.name}
          preload
        />
        <Card>
          <CardContent className="flex flex-col gap-3">
            {product.category !== null && (
              <Badge variant="secondary">{product.category.name}</Badge>
            )}
            <h1 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              {product.name}
            </h1>
            {product.brand !== null && <p className="text-muted-foreground">{product.brand}</p>}
            {/* Con el carrito, la nota de abajo explica la restricción y reemplaza a la insignia. */}
            {product.restriction === "recipe" && !cartEnabled() && <Badge variant="warning">Requiere récipe</Badge>}
            <PriceSummary summary={product.offers_summary} />
            {cartEnabled() && product.restriction !== "none" && (
              <p className="text-sm text-muted-foreground">{RESTRICTED_NOTE[product.restriction]}</p>
            )}
            <Suspense fallback={<FavoriteButtonSkeleton />}>
              <FavoriteButton target={{ kind: "product", slug: product.slug }} returnTo={`/p/${product.slug}`} />
            </Suspense>
            {product.attributes.length > 0 && (
              <div className="border-t border-border pt-4">
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  {product.attributes.map((attribute) => (
                    <div key={attribute.name} className="contents">
                      <dt className="text-muted-foreground">{attribute.name}</dt>
                      <dd className="text-foreground">{attribute.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {product.offers_summary.offer_count === 0 ? (
        <p className="text-muted-foreground">Sin disponibilidad ahora.</p>
      ) : (
        <Suspense fallback={<ProductOffersSkeleton />}>
          <ProductOffers
            product={{ slug: product.slug, name: product.name, restriction: product.restriction }}
            searchParams={searchParams}
          />
        </Suspense>
      )}
    </article>
  );
}
