// Entrega elegida por tienda en la URL (`f-<tienda>=delivery`; retiro por defecto). La leen el
// carrito y el checkout, y la usa también el formulario del cliente: sin `server-only`.

export type SearchParams = Record<string, string | string[] | undefined>;

export const FULFILLMENT_PARAM_PREFIX = "f-";

export function readDeliveryStores(searchParams: SearchParams): string[] {
  return Object.entries(searchParams)
    .filter(([name, value]) => name.startsWith(FULFILLMENT_PARAM_PREFIX) && value === "delivery")
    .map(([name]) => name.slice(FULFILLMENT_PARAM_PREFIX.length))
    .filter((slug) => slug.length > 0);
}

export function setDeliveryParams(query: URLSearchParams, delivery: string[]): void {
  for (const slug of delivery) query.set(`${FULFILLMENT_PARAM_PREFIX}${slug}`, "delivery");
}

// Cadena estable de la elección: `cache` de React compara los argumentos por identidad.
export function deliveryKey(delivery: string[]): string {
  return [...new Set(delivery)].sort().join(",");
}

export function deliveryFromKey(key: string): string[] {
  return key === "" ? [] : key.split(",");
}

export function cartPathWith(delivery: string[], slug: string, wantsDelivery: boolean): string {
  const rest = delivery.filter((current) => current !== slug);
  const query = new URLSearchParams();
  setDeliveryParams(query, wantsDelivery ? [...rest, slug] : rest);
  const search = query.toString();
  return search === "" ? "/carrito" : `/carrito?${search}`;
}

export function checkoutPathFor(delivery: string[]): string {
  const query = new URLSearchParams();
  setDeliveryParams(query, delivery);
  const search = query.toString();
  return search === "" ? "/checkout" : `/checkout?${search}`;
}
