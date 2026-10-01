import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { cartEnabled } from "@/features/cart/lib/flag";
import { formatRate, formatUpdatedAgo, formatUsd, formatVes } from "@/lib/format";
import { getStore } from "@/lib/marketplace/client";
import type { Store, StoreProduct } from "@/lib/marketplace/schemas";

const POSITIVE_INTEGER = /^\d+$/;

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || !POSITIVE_INTEGER.test(raw)) return 1;
  const page = Number.parseInt(raw, 10);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

function StoreProductCard({ product, store, now }: { product: StoreProduct; store: Store; now: Date }) {
  return (
    <Card className="h-full">
      <CardContent className="flex-1 flex flex-col gap-2">
        <Link
          href={`/p/${product.slug}`}
          className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {product.name}
        </Link>
        {(product.availability === "low" || product.restriction === "recipe") && (
          <div className="flex flex-wrap gap-1">
            {product.availability === "low" && <Badge variant="warning">Pocas unidades</Badge>}
            {product.restriction === "recipe" && <Badge variant="warning">Requiere récipe</Badge>}
          </div>
        )}
        <div>
          <p className="text-xl font-bold text-foreground">{formatUsd(product.price_usd)}</p>
          <p className="text-sm text-foreground">{formatVes(product.price_ves)}</p>
          <p className="text-sm text-muted-foreground">{formatUpdatedAgo(product.updated_at, now)}</p>
        </div>
        {cartEnabled() && store.accepts_orders && product.restriction === "none" && (
          <AddToCartButton
            storeSlug={store.slug}
            storeName={store.name}
            productSlug={product.slug}
            productName={product.name}
          />
        )}
      </CardContent>
    </Card>
  );
}

export async function StoreProducts({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pagina } = await searchParams;
  const page = parsePage(pagina);
  const response = await getStore({ slug, page });
  const now = new Date();

  if (response === null || response.meta.total === 0) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight">Productos</h2>
        <p className="text-muted-foreground">Esta tienda todavía no publicó productos.</p>
      </section>
    );
  }

  const { meta } = response;
  const lastPage = Math.max(1, Math.ceil(meta.total / meta.per_page));
  const pageHref = (target: number) => `/tienda/${slug}?pagina=${target}`;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight">Productos</h2>
      <p className="text-sm text-muted-foreground">{formatRate(response.rate)}</p>
      {response.products.length > 0 && (
        <ul aria-label="Productos" className="grid gap-4 sm:grid-cols-2">
          {response.products.map((product) => (
            <li key={product.slug}>
              <StoreProductCard product={product} store={response.data} now={now} />
            </li>
          ))}
        </ul>
      )}
      {lastPage > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-between gap-4">
          {meta.page > 1 ? (
            <Link href={pageHref(meta.page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-muted-foreground">
            Página {meta.page} de {lastPage}
          </p>
          {meta.page < lastPage ? (
            <Link href={pageHref(meta.page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Siguiente
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}

export function StoreProductsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-40" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    </div>
  );
}
