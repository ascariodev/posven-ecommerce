import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { UNAVAILABLE_TEXT } from "@/features/cart/lib/unavailable";
import { ProductThumb } from "@/features/search/components/ProductThumb";
import { formatUsd, formatVes } from "@/lib/format";
import { getBuyAgain } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { AccountContext } from "@/lib/marketplace/params";
import type { BuyAgainItem } from "@/lib/marketplace/schemas";

const HEADING_ID = "volver-a-comprar-titulo";

// Bloque secundario de /cuenta: con la API caída o un error de cuenta que no sea de sesión no se
// pinta (excepción de app-router.md 7). Un 401 sube: la sesión venció.
async function itemsOrNothing(ctx: AccountContext): Promise<BuyAgainItem[]> {
  try {
    return (await getBuyAgain(ctx)).data;
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) return [];
    if (error instanceof MarketplaceAccountError && error.code !== "unauthenticated") return [];
    throw error;
  }
}

function BuyAgainCard({ item }: { item: BuyAgainItem }) {
  const { product, store } = item;
  const ok = item.status === "ok";
  return (
    <Card size="sm" className="flex-row items-center gap-3 px-3">
      <div className={ok ? "shrink-0" : "shrink-0 opacity-50"}>
        <ProductThumb imageUrl={product.image_url} category={product.category} size="md" className="size-14" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/p/${product.slug}`}
          className="text-sm font-semibold text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {product.name}
        </Link>
        <Link
          href={`/tienda/${store.slug}`}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {store.name}
        </Link>
        {ok && item.price_usd !== null && item.price_ves !== null && (
          <p className="font-heading text-sm font-semibold tabular-nums text-foreground">
            {formatUsd(item.price_usd)} · {formatVes(item.price_ves)}
          </p>
        )}
        {!ok && item.unavailable_reason !== null && (
          <Badge variant="warning">{UNAVAILABLE_TEXT[item.unavailable_reason]}</Badge>
        )}
        {ok && (
          <AddToCartButton
            storeSlug={store.slug}
            storeName={store.name}
            productSlug={product.slug}
            productName={product.name}
          />
        )}
      </div>
    </Card>
  );
}

// "Volver a comprar" en /cuenta: productos de compras pagadas con su precio de hoy (GET
// /me/buy-again). Sin ítems o con la API caída no se pinta nada.
export async function BuyAgain({ ctx }: { ctx: AccountContext }) {
  const items = await itemsOrNothing(ctx);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-3">
      <h2 id={HEADING_ID} className="font-heading text-lg font-semibold tracking-tight text-foreground">
        Volver a comprar
      </h2>
      <ul aria-label="Volver a comprar" className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={`${item.store.slug}/${item.product.slug}`}>
            <BuyAgainCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
