// Elección del checkout en la URL, para que cambiarla vuelva a cotizar en el servidor:
// `direccion=<id>` y `f-<tienda>=delivery` (retiro por defecto; ésta vive en el carrito). Sin
// `server-only`: la usa también el formulario del cliente para navegar.

import {
  FULFILLMENT_PARAM_PREFIX,
  readDeliveryStores,
  setDeliveryParams,
  type SearchParams,
} from "@/features/cart/lib/fulfillment";

export { FULFILLMENT_PARAM_PREFIX };

export type CheckoutParams = { addressId: number | null; delivery: string[] };

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export function readCheckoutParams(searchParams: SearchParams): CheckoutParams {
  const rawAddress = single(searchParams.direccion);
  const addressId = rawAddress !== null && /^[1-9]\d{0,8}$/.test(rawAddress) ? Number(rawAddress) : null;
  return { addressId, delivery: readDeliveryStores(searchParams) };
}

export function checkoutHref(addressId: number | null, delivery: string[]): string {
  const query = new URLSearchParams();
  if (addressId !== null) query.set("direccion", String(addressId));
  setDeliveryParams(query, delivery);
  const search = query.toString();
  return search === "" ? "/checkout" : `/checkout?${search}`;
}
