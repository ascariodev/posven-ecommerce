"use client";

import { useActionState, type ReactNode } from "react";
import { toast } from "sonner";
import { INITIAL_ADD_TO_CART_STATE, type AddToCartState } from "../lib/addToCartState";

type Props = {
  action: (prev: AddToCartState, formData: FormData) => Promise<AddToCartState>;
  storeSlug: string;
  productSlug: string;
  quantity?: number;
  children: ReactNode;
};

export function LineForm({ action, storeSlug, productSlug, quantity, children }: Props) {
  // El toast va dentro de la acción: el refresh() puede quitar la línea y un efecto no llegaría a correr.
  const [, formAction] = useActionState(async (prev: AddToCartState, formData: FormData) => {
    const next = await action(prev, formData);
    if (next.status === "error" && next.message !== null) toast.error(next.message);
    return next;
  }, INITIAL_ADD_TO_CART_STATE);

  return (
    <form action={formAction}>
      <input type="hidden" name="store_slug" value={storeSlug} />
      <input type="hidden" name="product_slug" value={productSlug} />
      {quantity !== undefined && <input type="hidden" name="quantity" value={quantity} />}
      {children}
    </form>
  );
}
