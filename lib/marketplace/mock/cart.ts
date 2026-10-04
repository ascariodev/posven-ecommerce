import type { AccountContext } from "../params";
import {
  CART_MAX_LINES as MAX_LINES,
  CART_MAX_QUANTITY as MAX_QUANTITY,
  cartItemPutSchema,
  cartItemsSchema,
  type Cart,
  type CartItem,
  type CartItemPut,
  type CartLine,
  type CartStore,
  type Money,
  type UnavailableReason,
} from "../schemas";
import { accountError, customerIdFor } from "./accounts";
import { MOCK_PRODUCTS, MOCK_RATE, MOCK_STORE_DETAILS, MOCK_STORES, MOCK_UNAVAILABLE_PRODUCTS, type MockOffer, type MockStore } from "./fixtures";
import { multiply, sum } from "./money";
import { mockNow, openStatus } from "./schedule";

// Reglas de la spec cuentas-y-compras §5.2 con la enmienda del 2026-09-30 (C, D, E, G, J y K).

type MockCartsState = Map<number, CartItem[]>;

// En globalThis y no en el módulo, como mock/accounts.ts: el servidor de desarrollo puede evaluar
// este archivo más de una vez.
const STATE_KEY = Symbol.for("posven.mockCarts");
const stateHolder = globalThis as unknown as Record<symbol, MockCartsState | undefined>;

function carts(): MockCartsState {
  return (stateHolder[STATE_KEY] ??= new Map());
}

export function resetMockCarts(): void {
  delete stateHolder[STATE_KEY];
}

type CatalogProduct = { product: CartLine["product"]; restricted: boolean; offers: MockOffer[] };

function findStore(slug: string): MockStore | undefined {
  return MOCK_STORES.find((store) => store.summary.slug === slug);
}

function findProduct(slug: string): CatalogProduct | undefined {
  const listed = MOCK_PRODUCTS.find((entry) => entry.product.slug === slug);
  const product = listed?.product ?? MOCK_UNAVAILABLE_PRODUCTS.find((entry) => entry.slug === slug);
  if (product === undefined) return undefined;
  const { name, image_url, category, restriction } = product;
  return {
    product: { slug: product.slug, name, image_url, category },
    restricted: restriction !== "none",
    offers: listed?.offers ?? [],
  };
}

// Stock publicado simulado: no es contrato, sólo sirve para el techo de las cantidades.
function stockOf(offer: MockOffer | undefined): number {
  if (offer === undefined) return MAX_QUANTITY;
  return offer.availability === "low" ? 3 : 50;
}

function sameLine(a: CartItem, b: { store_slug: string; product_slug: string }): boolean {
  return a.store_slug === b.store_slug && a.product_slug === b.product_slug;
}

// Prioridad de los motivos (no la fija la enmienda C): restringido, tienda que no vende, oferta
// desaparecida. `out_of_stock` no se produce aquí: el stock simulado sale de `availability`.
function unavailableReason(store: MockStore, catalog: CatalogProduct, offer: MockOffer | undefined): UnavailableReason | null {
  if (catalog.restricted) return "restricted";
  if (!store.summary.accepts_orders) return "store_not_selling";
  if (offer === undefined) return "offer_gone";
  return null;
}

function toLine(item: CartItem, store: MockStore, catalog: CatalogProduct): CartLine {
  const offer = catalog.offers.find((candidate) => candidate.store_slug === item.store_slug);
  const reason = unavailableReason(store, catalog, offer);
  const quantity = Math.min(item.quantity, stockOf(offer));
  return {
    product: catalog.product,
    quantity,
    price_usd: offer?.price_usd ?? null,
    price_ves: offer?.price_ves ?? null,
    line_usd: offer === undefined ? null : multiply(offer.price_usd, quantity),
    line_ves: offer === undefined ? null : multiply(offer.price_ves, quantity),
    availability: reason === null ? (offer?.availability ?? null) : null,
    status: reason === null ? "ok" : "unavailable",
    unavailable_reason: reason,
  };
}

function okAmounts(lines: CartLine[], field: "line_usd" | "line_ves"): Money[] {
  return lines.flatMap((line) => (line.status === "ok" && line[field] !== null ? [line[field]] : []));
}

// Cotiza entradas: agrupa por tienda en el orden de llegada, omite tiendas o productos inexistentes
// y suma sólo las líneas `ok` (enmienda D). La usa también el checkout simulado.
export function quoteItems(items: CartItem[]): Cart {
  const stores: CartStore[] = [];
  for (const item of items) {
    const store = findStore(item.store_slug);
    const catalog = findProduct(item.product_slug);
    if (store === undefined || catalog === undefined) continue;
    let entry = stores.find((candidate) => candidate.store.slug === item.store_slug);
    if (entry === undefined) {
      entry = {
        store: store.summary,
        is_open: store.is_open,
        closes_at: openStatus(MOCK_STORE_DETAILS[item.store_slug]?.schedule ?? [], mockNow()).closes_at,
        accepts_orders: store.summary.accepts_orders,
        offers_delivery: store.offers_delivery,
        lines: [],
        subtotal_usd: "0.00",
        subtotal_ves: "0.00",
      };
      stores.push(entry);
    }
    entry.lines.push(toLine(item, store, catalog));
  }
  for (const entry of stores) {
    entry.subtotal_usd = sum(okAmounts(entry.lines, "line_usd"));
    entry.subtotal_ves = sum(okAmounts(entry.lines, "line_ves"));
  }
  const lines = stores.flatMap((entry) => entry.lines);
  return {
    stores,
    total_usd: sum(stores.map((entry) => entry.subtotal_usd)),
    total_ves: sum(stores.map((entry) => entry.subtotal_ves)),
    line_count: lines.filter((line) => line.status === "ok").length,
    rate: MOCK_RATE,
  };
}

const FIELD_MESSAGES: Record<string, string> = {
  store_slug: "Elige una tienda válida.",
  product_slug: "Elige un producto válido.",
  quantity: "La cantidad debe estar entre 0 y 99.",
};

// Un mensaje por campo con error, como la API (enmienda G: "el de cada campo").
function fieldErrors(issues: { path: PropertyKey[] }[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "quantity");
    fields[key] ??= FIELD_MESSAGES[key] ?? "Revisa este dato.";
  }
  return fields;
}

function parseItems(items: unknown): CartItem[] {
  const parsed = cartItemsSchema.safeParse(items);
  if (!parsed.success) throw accountError("validation_failed", { items: "Revisa los productos del carrito." });
  return parsed.data;
}

export async function quoteGuestCart(_ctx: AccountContext, items: CartItem[]): Promise<Cart> {
  return quoteItems(parseItems(items));
}

export async function getCart(ctx: AccountContext): Promise<Cart> {
  return quoteItems(cartItemsFor(customerIdFor(ctx)));
}

export function cartItemsFor(customerId: number): CartItem[] {
  return structuredClone(carts().get(customerId) ?? []);
}

// Al pagarse una compra se quitan del carrito las líneas compradas (spec §5.3 paso 4).
export function removeCartLines(customerId: number, refs: { store_slug: string; product_slug: string }[]): void {
  const lines = carts().get(customerId) ?? [];
  carts().set(
    customerId,
    lines.filter((line) => !refs.some((ref) => sameLine(line, ref))),
  );
}

// Al eliminar la cuenta se borra su carrito (spec §5.8).
export function clearMockCart(customerId: number): void {
  carts().delete(customerId);
}

export async function setCartItem(ctx: AccountContext, input: CartItemPut): Promise<Cart> {
  const id = customerIdFor(ctx);
  const parsed = cartItemPutSchema.safeParse(input);
  if (!parsed.success) throw accountError("validation_failed", fieldErrors(parsed.error.issues));
  const item = parsed.data;
  const lines = carts().get(id) ?? [];
  // `quantity: 0` borra siempre, sin validar si la línea se puede comprar (enmienda J).
  if (item.quantity === 0) {
    carts().set(id, lines.filter((line) => !sameLine(line, item)));
    return getCart(ctx);
  }
  const store = findStore(item.store_slug);
  const catalog = findProduct(item.product_slug);
  if (catalog?.restricted) throw accountError("product_restricted");
  const offer = catalog?.offers.find((candidate) => candidate.store_slug === item.store_slug);
  if (store === undefined || !store.summary.accepts_orders || offer === undefined) throw accountError("not_orderable");
  const quantity = Math.min(item.quantity, stockOf(offer));
  const existing = lines.find((line) => sameLine(line, item));
  if (existing !== undefined) {
    existing.quantity = quantity;
  } else {
    if (lines.length >= MAX_LINES) throw accountError("cart_full");
    lines.push({ store_slug: item.store_slug, product_slug: item.product_slug, quantity });
  }
  carts().set(id, lines);
  return getCart(ctx);
}

// Suma las líneas repetidas con techo de stock y agrega las nuevas hasta 20 líneas; las que
// pasarían de 20 se descartan sin error (enmienda K).
export async function mergeCart(ctx: AccountContext, items: CartItem[]): Promise<Cart> {
  const id = customerIdFor(ctx);
  const incoming = parseItems(items);
  const lines = carts().get(id) ?? [];
  for (const item of incoming) {
    const catalog = findProduct(item.product_slug);
    if (findStore(item.store_slug) === undefined || catalog === undefined) continue;
    const ceiling = stockOf(catalog.offers.find((offer) => offer.store_slug === item.store_slug));
    const existing = lines.find((line) => sameLine(line, item));
    if (existing !== undefined) {
      existing.quantity = Math.min(existing.quantity + item.quantity, ceiling, MAX_QUANTITY);
    } else if (lines.length < MAX_LINES) {
      lines.push({ ...item, quantity: Math.min(item.quantity, ceiling) });
    }
  }
  carts().set(id, lines);
  return getCart(ctx);
}
