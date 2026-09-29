import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ViewBeacon } from "@/features/events/ViewBeacon";
import { productJsonLd } from "@/features/product/jsonld";
import { loadProduct } from "@/features/product/load";
import { productMetadata } from "@/features/product/metadata";
import { ProductOffers, ProductOffersSkeleton } from "@/features/product/ProductOffers";
import { ProductThumb } from "@/features/search/ProductThumb";
import { breadcrumbListJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { listCategories, listSitemap } from "@/lib/marketplace/client";
import type { CategoryNode, ProductDetail } from "@/lib/marketplace/schemas";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Crumb = { name: string; path: string };

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

async function breadcrumbsFor(product: ProductDetail): Promise<Crumb[]> {
  const crumbs: Crumb[] = [{ name: "Inicio", path: "/" }];
  const category = product.category;
  if (category === null) return crumbs;
  if (category.parent_slug !== null) {
    const parent = findCategory(await listCategories(), category.parent_slug);
    if (parent !== null) crumbs.push({ name: parent.name, path: `/categoria/${parent.slug}` });
  }
  crumbs.push({ name: category.name, path: `/categoria/${category.slug}` });
  return crumbs;
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
  const crumbs = await breadcrumbsFor(product);

  return (
    <article className="flex flex-col gap-6">
      <JsonLdScript data={productJsonLd(product)} />
      <JsonLdScript data={breadcrumbListJsonLd(crumbs)} />
      <ViewBeacon event={{ type: "product_view", store_slug: null, product_slug: slug }} />
      <nav aria-label="Migas de pan">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((crumb, index) => (
            <li key={crumb.path} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">›</span>}
              <Link href={crumb.path} className="hover:text-foreground hover:underline">
                {crumb.name}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex flex-col gap-6 sm:flex-row">
        <ProductThumb
          imageUrl={product.image_url}
          category={product.category}
          size="lg"
          alt={product.name}
          preload
        />
        <div className="flex min-w-0 flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{product.name}</h1>
          {product.brand !== null && <p className="text-muted-foreground">{product.brand}</p>}
          {product.restriction === "recipe" && (
            <Badge variant="warning" className="self-start">
              Requiere récipe
            </Badge>
          )}
          {product.attributes.length > 0 && (
            <Card>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {product.attributes.map((attribute) => (
                  <div key={attribute.name} className="contents">
                    <dt className="text-muted-foreground">{attribute.name}</dt>
                    <dd className="text-foreground">{attribute.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
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
