"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { addToCart } from "./actions";
import { INITIAL_ADD_TO_CART_STATE } from "./addToCartState";

// Suma 1 y se queda en la página (plan 4a, decisión 5). Es un formulario: sin JavaScript también
// agrega. El nombre accesible empieza por el texto visible (WCAG 2.5.3) y nombra producto y tienda,
// porque la ficha muestra un botón por oferta.
export function AddToCartButton({
  storeSlug,
  storeName,
  productSlug,
  productName,
}: {
  storeSlug: string;
  storeName: string;
  productSlug: string;
  productName: string;
}) {
  const [state, formAction, pending] = useActionState(addToCart, INITIAL_ADD_TO_CART_STATE);
  const label = state.status === "added" ? "Agregar otro" : "Agregar al carrito";
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <input type="hidden" name="store_slug" value={storeSlug} />
      <input type="hidden" name="product_slug" value={productSlug} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        aria-label={`${label}: ${productName} de ${storeName}`}
      >
        <ShoppingCart aria-hidden="true" className="size-4" />
        {pending ? "Agregando…" : label}
      </Button>
      <p role="status" className="text-sm">
        {state.status === "added" && (
          <>
            <span className="text-foreground">Agregado</span>
            {" · "}
            <Link
              href="/carrito"
              className="font-medium text-foreground underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Ver carrito
            </Link>
          </>
        )}
        {state.status === "error" && <span className="text-destructive">{state.message}</span>}
      </p>
    </form>
  );
}
