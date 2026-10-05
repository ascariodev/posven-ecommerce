import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/features/search/components/ProductThumb";
import { formatUsd, formatVes } from "@/lib/format";
import {
  CART_MAX_QUANTITY as MAX_QUANTITY,
  type CartLine as CartLineData,
  type UnavailableReason,
} from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { removeLine, setQuantity } from "../server/actions";
import { LineForm } from "./LineForm";

const UNAVAILABLE_TEXT: Record<UnavailableReason, string> = {
  out_of_stock: "Sin existencias",
  store_not_selling: "La tienda ya no vende en línea",
  offer_gone: "Ya no se ofrece en esta tienda",
  restricted: "Se vende sólo en tienda",
};

// Los montos son las cadenas de la API formateadas: aquí no se suma ni se multiplica nada.
export function CartLine({ line, storeSlug }: { line: CartLineData; storeSlug: string }) {
  const { product } = line;
  const ok = line.status === "ok";
  return (
    <li className="flex gap-3 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0">
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
              <p className="font-heading font-semibold tabular-nums text-foreground">{formatUsd(line.line_usd)}</p>
              <p className="text-sm tabular-nums text-foreground">{formatVes(line.line_ves)}</p>
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
