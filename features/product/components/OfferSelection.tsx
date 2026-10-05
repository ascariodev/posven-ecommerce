"use client";

import { Check } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { formatUsd, formatVes } from "@/lib/format";
import type { Money } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";

export type SelectableOffer = {
  storeSlug: string;
  storeName: string;
  priceUsd: Money;
  priceVes: Money;
  canOrder: boolean;
};

type Selection = {
  offers: SelectableOffer[];
  selectedSlug: string;
  select: (storeSlug: string) => void;
};

const SelectionContext = createContext<Selection | null>(null);

export function OfferSelectionProvider({
  offers,
  defaultSlug,
  children,
}: {
  offers: SelectableOffer[];
  defaultSlug: string;
  children: ReactNode;
}) {
  const [selectedSlug, select] = useState(defaultSlug);
  return <SelectionContext value={{ offers, selectedSlug, select }}>{children}</SelectionContext>;
}

export function OfferSelectButton({ storeSlug, storeName }: { storeSlug: string; storeName: string }) {
  const selection = useContext(SelectionContext);
  if (selection === null) return null;
  const selected = selection.selectedSlug === storeSlug;
  return (
    <Button
      type="button"
      variant={selected ? "secondary" : "outline"}
      size="sm"
      aria-pressed={selected}
      aria-label={`${selected ? "Tienda elegida" : "Elegir tienda"}: ${storeName}`}
      onClick={() => selection.select(storeSlug)}
      className="w-full font-bold sm:w-auto"
    >
      {selected && <Check aria-hidden="true" className="size-4" />}
      {selected ? "Elegida" : "Elegir"}
    </Button>
  );
}

export function PurchaseBar({ product }: { product: { slug: string; name: string } }) {
  const selection = useContext(SelectionContext);
  if (selection === null) return null;
  const offer = selection.offers.find((item) => item.storeSlug === selection.selectedSlug);
  if (offer === undefined) return null;
  return (
    <section
      aria-label="Compra"
      data-purchase-bar
      className={cn(
        "fixed inset-x-0 bottom-(--toast-bottom) z-30 border-t border-border bg-card p-3 shadow-raised",
        "md:sticky md:inset-x-auto md:bottom-4 md:rounded-2xl md:border md:p-4",
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 md:max-w-none">
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-sm font-medium text-muted-foreground">{offer.storeName}</p>
          <p className="font-heading text-xl font-extrabold tabular-nums text-foreground">
            {formatUsd(offer.priceUsd)}
            <span className="ml-2 text-sm font-medium text-muted-foreground">{formatVes(offer.priceVes)}</span>
          </p>
        </div>
        {offer.canOrder ? (
          <AddToCartButton
            key={offer.storeSlug}
            storeSlug={offer.storeSlug}
            storeName={offer.storeName}
            productSlug={product.slug}
            productName={product.name}
            variant="default"
            size="lg"
            nameQualifier="de la tienda elegida"
            className="shrink-0 justify-end"
          />
        ) : (
          <p className="text-right text-sm font-medium text-muted-foreground">Esta tienda no recibe pedidos en línea.</p>
        )}
      </div>
    </section>
  );
}
