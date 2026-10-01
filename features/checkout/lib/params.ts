// Elección del checkout en la URL, para que cambiarla vuelva a cotizar en el servidor:
// `direccion=<id>` y `f-<tienda>=delivery` (retiro por defecto). Sin `server-only`: la usa también
// el formulario del cliente para navegar.

export type CheckoutParams = { addressId: number | null; delivery: string[] };

type SearchParams = Record<string, string | string[] | undefined>;

export const FULFILLMENT_PARAM_PREFIX = "f-";

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export function readCheckoutParams(searchParams: SearchParams): CheckoutParams {
  const rawAddress = single(searchParams.direccion);
  const addressId = rawAddress !== null && /^[1-9]\d{0,8}$/.test(rawAddress) ? Number(rawAddress) : null;
  const delivery = Object.entries(searchParams)
    .filter(([name, value]) => name.startsWith(FULFILLMENT_PARAM_PREFIX) && single(value) === "delivery")
    .map(([name]) => name.slice(FULFILLMENT_PARAM_PREFIX.length))
    .filter((slug) => slug.length > 0);
  return { addressId, delivery };
}

export function checkoutHref(addressId: number | null, delivery: string[]): string {
  const query = new URLSearchParams();
  if (addressId !== null) query.set("direccion", String(addressId));
  for (const slug of delivery) query.set(`${FULFILLMENT_PARAM_PREFIX}${slug}`, "delivery");
  const search = query.toString();
  return search === "" ? "/checkout" : `/checkout?${search}`;
}
