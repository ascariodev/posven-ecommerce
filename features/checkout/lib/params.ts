// Elección del checkout en la URL, para que cambiarla vuelva a cotizar en el servidor:
// `direccion=<id>`, `f-<tienda>=delivery` (retiro por defecto; ésta vive en el carrito) y
// `p-<tienda>=in_store` (pago online por defecto). Sin `server-only`: la usa también el formulario
// del cliente para navegar.

import {
  FULFILLMENT_PARAM_PREFIX,
  readDeliveryStores,
  setDeliveryParams,
  type SearchParams,
} from "@/features/cart/lib/fulfillment";

export { FULFILLMENT_PARAM_PREFIX };

export const PAYMENT_PARAM_PREFIX = "p-";

export type CheckoutParams = { addressId: number | null; delivery: string[]; inStore: string[] };

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function readInStoreStores(searchParams: SearchParams): string[] {
  return Object.entries(searchParams)
    .filter(([name, value]) => name.startsWith(PAYMENT_PARAM_PREFIX) && value === "in_store")
    .map(([name]) => name.slice(PAYMENT_PARAM_PREFIX.length))
    .filter((slug) => slug.length > 0);
}

export function readCheckoutParams(searchParams: SearchParams): CheckoutParams {
  const rawAddress = single(searchParams.direccion);
  const addressId = rawAddress !== null && /^[1-9]\d{0,8}$/.test(rawAddress) ? Number(rawAddress) : null;
  return { addressId, delivery: readDeliveryStores(searchParams), inStore: readInStoreStores(searchParams) };
}

export function checkoutHref(addressId: number | null, delivery: string[], inStore: string[] = []): string {
  const query = new URLSearchParams();
  if (addressId !== null) query.set("direccion", String(addressId));
  setDeliveryParams(query, delivery);
  for (const slug of inStore) query.set(`${PAYMENT_PARAM_PREFIX}${slug}`, "in_store");
  const search = query.toString();
  return search === "" ? "/checkout" : `/checkout?${search}`;
}
