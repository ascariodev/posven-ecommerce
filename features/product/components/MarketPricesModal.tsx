"use client";

import { useState } from "react";
import { X, Store, PiggyBank } from "lucide-react";
import { formatUsd, formatVes } from "@/lib/format";
import type { ProductOffer } from "@/lib/marketplace/schemas";
import { Button } from "@/components/ui/button";

export function MarketPricesModal({ offers }: { offers: ProductOffer[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (offers.length === 0) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-primary hover:underline underline-offset-2"
      >
        Ver precios por farmacia
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-card shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-heading text-lg font-bold text-foreground">Precios de mercado para este medicamento</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="overflow-y-auto p-2">
              <ul className="flex flex-col">
                {offers.map((offer, index) => (
                  <li key={`${offer.store.slug}-${index}`} className="flex items-center justify-between border-b border-border/50 p-3 last:border-0 hover:bg-muted/30 transition-colors rounded-lg">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{offer.store.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-foreground">{formatUsd(offer.price_usd)}</span>
                      <span className="text-xs text-muted-foreground">{formatVes(offer.price_ves)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-t border-border bg-muted/20 p-4 text-center rounded-b-2xl">
              <p className="text-sm text-muted-foreground">
                Seleccionaremos automáticamente la opción más económica para tu envío.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
