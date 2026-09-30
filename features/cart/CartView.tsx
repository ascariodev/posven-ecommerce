import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductThumb } from "@/features/search/ProductThumb";
import { formatRate, formatUsd, formatVes } from "@/lib/format";
import type { Cart, CartLine, CartStore, UnavailableReason } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { removeLine, setQuantity } from "./actions";
import { getCurrentCart } from "./server";

const MAX_QUANTITY = 99;

const UNAVAILABLE_TEXT: Record<UnavailableReason, string> = {
  out_of_stock: "Sin existencias",
  store_not_selling: "La tienda ya no vende en línea",
  offer_gone: "Ya no se ofrece en esta tienda",
  restricted: "Se vende sólo en tienda",
};

// Los montos son las cadenas de la API formateadas: aquí no se suma ni se multiplica nada.

function LineForm({
  action,
  storeSlug,
  productSlug,
  quantity,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  storeSlug: string;
  productSlug: string;
  quantity?: number;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="store_slug" value={storeSlug} />
      <input type="hidden" name="product_slug" value={productSlug} />
      {quantity !== undefined && <input type="hidden" name="quantity" value={quantity} />}
      {children}
    </form>
  );
}

function Line({ line, storeSlug }: { line: CartLine; storeSlug: string }) {
  const { product } = line;
  const ok = line.status === "ok";
  return (
    <li className="flex gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      {/* Sólo la imagen se atenúa en una línea no disponible: el texto conserva el contraste AA. */}
      <div className={cn("shrink-0", !ok && "opacity-50")}>
        <ProductThumb imageUrl={product.image_url} category={product.category} size="md" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              href={`/p/${product.slug}`}
              className={cn(
                "font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                ok ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {product.name}
            </Link>
            {line.price_usd !== null && line.price_ves !== null && (
              <p className="text-sm text-muted-foreground">
                {formatUsd(line.price_usd)} · {formatVes(line.price_ves)} c/u
              </p>
            )}
            {!ok && line.unavailable_reason !== null && (
              <Badge variant="warning">{UNAVAILABLE_TEXT[line.unavailable_reason]}</Badge>
            )}
          </div>
          {ok && line.line_usd !== null && line.line_ves !== null && (
            <div className="flex flex-col sm:items-end">
              <p className="font-bold text-foreground">{formatUsd(line.line_usd)}</p>
              <p className="text-sm text-foreground">{formatVes(line.line_ves)}</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ok && (
            <div role="group" aria-label={`Cantidad de ${product.name}`} className="flex items-center gap-2">
              <LineForm action={setQuantity} storeSlug={storeSlug} productSlug={product.slug} quantity={line.quantity - 1}>
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className="size-11 md:size-9"
                  disabled={line.quantity <= 1}
                  aria-label={`Quitar uno: ${product.name}`}
                >
                  <Minus aria-hidden="true" />
                </Button>
              </LineForm>
              <span className="min-w-8 text-center font-medium tabular-nums">
                <span className="sr-only">Cantidad: </span>
                {line.quantity}
              </span>
              <LineForm action={setQuantity} storeSlug={storeSlug} productSlug={product.slug} quantity={line.quantity + 1}>
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className="size-11 md:size-9"
                  disabled={line.quantity >= MAX_QUANTITY}
                  aria-label={`Agregar uno: ${product.name}`}
                >
                  <Plus aria-hidden="true" />
                </Button>
              </LineForm>
            </div>
          )}
          <LineForm action={removeLine} storeSlug={storeSlug} productSlug={product.slug}>
            <Button type="submit" variant="ghost" size="sm" aria-label={`Quitar: ${product.name}`}>
              <Trash2 aria-hidden="true" className="size-4" />
              Quitar
            </Button>
          </LineForm>
        </div>
      </div>
    </li>
  );
}

function StoreGroup({ entry }: { entry: CartStore }) {
  const { store } = entry;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-lg font-bold tracking-tight">
            <Link
              href={`/tienda/${store.slug}`}
              className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {store.name}
            </Link>
          </h2>
          <span className="text-sm text-muted-foreground">{store.city.name}</span>
          {!entry.is_open && <Badge variant="secondary">Cerrada ahora</Badge>}
        </div>
        <ul aria-label={`Productos de ${store.name}`} className="flex flex-col gap-4">
          {entry.lines.map((line) => (
            <Line key={line.product.slug} line={line} storeSlug={store.slug} />
          ))}
        </ul>
        <p className="flex justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold text-foreground">
            {formatUsd(entry.subtotal_usd)} · {formatVes(entry.subtotal_ves)}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

export function CartContent({ cart }: { cart: Cart | null }) {
  if (cart === null || cart.stores.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-muted-foreground">Tu carrito está vacío.</p>
        <Link href="/buscar" className={buttonVariants({ variant: "outline" })}>
          Buscar productos
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {cart.stores.map((entry) => (
        <StoreGroup key={entry.store.slug} entry={entry} />
      ))}
      <Card>
        <CardContent className="flex flex-col gap-1">
          <p className="flex items-baseline justify-between gap-4">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-2xl font-extrabold text-foreground">{formatUsd(cart.total_usd)}</span>
          </p>
          <p className="text-right text-foreground">{formatVes(cart.total_ves)}</p>
          <p className="text-right text-sm text-muted-foreground">{formatRate(cart.rate)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export async function CartView() {
  return <CartContent cart={await getCurrentCart()} />;
}

export function CartViewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
