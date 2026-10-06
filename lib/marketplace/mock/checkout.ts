import { createHash } from "node:crypto";
import { SITE_URL } from "../../site";
import type { AccountContext } from "../params";
import {
  checkoutInputSchema,
  checkoutQuoteInputSchema,
  type Address,
  type CartItem,
  type BuyAgainItem,
  type BuyAgainResponse,
  type CartStore,
  type CheckoutInput,
  type CheckoutQuoteInput,
  type CheckoutStart,
  type DeliveryUnavailableReason,
  type Money,
  type Purchase,
  type PurchasePage,
  type Quote,
  type QuoteStore,
  type StoreOrder,
  type StoreOrderLine,
} from "../schemas";
import { accountError, customerIdFor, mockAccountFor } from "./accounts";
import { cartItemsFor, quoteItems, removeCartLines } from "./cart";
import { MOCK_FAILED_PAYMENT_EMAIL, MOCK_MISSING_LINE, MOCK_RATE, MOCK_STORES, type MockStore } from "./fixtures";
import { sum } from "./money";

// Checkout, pago `fake` y compras (spec cuentas-y-compras §5.3, §5.5 y §5.8; enmienda F, G, H y L).
// El pago avanza por consultas del detalle (decisión 4 del plan 4b): primera `pending_payment` con
// sus pedidos `pending_payment`, segunda `paid` con los pedidos `accepted` (o `failed` con los
// pedidos `cancelled`), tercera en adelante listo para retirar o en camino.

const PER_PAGE = 10;
const ZERO: Money = "0.00";
// Alfabeto de los códigos (spec §3, enmienda L): mayúsculas y dígitos sin 0, O, 1, I ni L.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

type LineRef = { store_slug: string; product_slug: string };

type MockPurchase = {
  customerId: number;
  sequence: number;
  failsPayment: boolean;
  bought: LineRef[];
  consultations: number;
  purchase: Purchase;
};

type MockPurchasesState = {
  purchases: Map<string, MockPurchase>;
  // Clave `<comprador>:<idempotency_key>`: la misma respuesta sin una segunda compra (§6).
  started: Map<string, CheckoutStart>;
  nextSequence: number;
};

// En globalThis y no en el módulo, como mock/accounts.ts: el servidor de desarrollo puede evaluar
// este archivo más de una vez.
const STATE_KEY = Symbol.for("posven.mockPurchases");
const stateHolder = globalThis as unknown as Record<symbol, MockPurchasesState | undefined>;

function state(): MockPurchasesState {
  return (stateHolder[STATE_KEY] ??= { purchases: new Map(), started: new Map(), nextSequence: 1 });
}

export function resetMockPurchases(): void {
  delete stateHolder[STATE_KEY];
}

function findStore(slug: string): MockStore | undefined {
  return MOCK_STORES.find((store) => store.summary.slug === slug);
}

// Distancia haversine en km, como la búsqueda de posveapi (spec §5.3 paso 1).
function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to.lat - from.lat);
  const dLng = radians(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function deliveryUnavailableReason(store: MockStore, address: Address | null): DeliveryUnavailableReason | null {
  if (!store.offers_delivery || store.delivery_radius_km === null) return "no_delivery";
  if (address === null) return "no_address";
  const storePoint = { lat: store.summary.latitude, lng: store.summary.longitude };
  if (distanceKm(address, storePoint) > store.delivery_radius_km) return "out_of_radius";
  return null;
}

function okLines(store: CartStore): CartStore["lines"] {
  return store.lines.filter((line) => line.status === "ok");
}

const ADDRESS_ERROR = { address_id: "Elige una dirección de entrega." };

type Quoted = { quote: Quote; stores: CartStore[]; address: Address | null; items: CartItem[] };

function buildQuote(ctx: AccountContext, input: CheckoutQuoteInput): Quoted {
  const account = mockAccountFor(ctx);
  const address = input.address_id === null ? null : (account.addresses.find((entry) => entry.id === input.address_id) ?? null);
  if (input.address_id !== null && address === null) throw accountError("validation_failed", ADDRESS_ERROR);
  if (address === null && input.stores.some((store) => store.fulfillment === "delivery")) {
    throw accountError("validation_failed", ADDRESS_ERROR);
  }

  const items = cartItemsFor(account.id);
  const cart = quoteItems(items);
  const stores: CartStore[] = [];
  const quoteStores: QuoteStore[] = [];
  for (const requested of input.stores) {
    const cartStore = cart.stores.find((entry) => entry.store.slug === requested.store_slug);
    const store = findStore(requested.store_slug);
    if (cartStore === undefined || store === undefined || okLines(cartStore).length === 0) continue;
    const reason = deliveryUnavailableReason(store, address);
    const fulfillment = requested.fulfillment === "delivery" && reason === null ? "delivery" : "pickup";
    const feeUsd = fulfillment === "delivery" ? (store.delivery_fee_usd ?? ZERO) : ZERO;
    const feeVes = fulfillment === "delivery" ? (store.delivery_fee_ves ?? ZERO) : ZERO;
    stores.push(cartStore);
    quoteStores.push({
      store_slug: requested.store_slug,
      fulfillment,
      delivery_available: reason === null,
      delivery_unavailable_reason: reason,
      subtotal_usd: cartStore.subtotal_usd,
      subtotal_ves: cartStore.subtotal_ves,
      delivery_fee_usd: feeUsd,
      delivery_fee_ves: feeVes,
      total_usd: sum([cartStore.subtotal_usd, feeUsd]),
      total_ves: sum([cartStore.subtotal_ves, feeVes]),
    });
  }
  if (quoteStores.length === 0) throw accountError("cart_empty");

  const totalVes = sum(quoteStores.map((store) => store.total_ves));
  const body = {
    stores: quoteStores,
    total_usd: sum(quoteStores.map((store) => store.total_usd)),
    total_ves: totalVes,
    charge: { currency: "VES" as const, amount: totalVes },
    rate: MOCK_RATE,
  };
  // Cadena opaca: cubre la Quote, la dirección y las cantidades del carrito.
  const quote_hash = createHash("sha256")
    .update(JSON.stringify({ body, address_id: input.address_id, items }))
    .digest("hex");
  return { quote: { quote_hash, ...body }, stores, address, items };
}

export async function quoteCheckout(ctx: AccountContext, input: CheckoutQuoteInput): Promise<Quote> {
  customerIdFor(ctx);
  const parsed = checkoutQuoteInputSchema.safeParse(input);
  if (!parsed.success) throw accountError("validation_failed", { stores: "Revisa las tiendas del checkout." });
  return buildQuote(ctx, parsed.data).quote;
}

function toOrderLine(line: CartStore["lines"][number]): StoreOrderLine {
  // Una línea `ok` siempre trae sus montos (enmienda D).
  return {
    product: line.product,
    quantity: line.quantity,
    accepted_quantity: line.quantity,
    unit_usd: line.price_usd ?? ZERO,
    unit_ves: line.price_ves ?? ZERO,
    line_usd: line.line_usd ?? ZERO,
    line_ves: line.line_ves ?? ZERO,
    missing: false,
  };
}

function toOrder(cartStore: CartStore, quoteStore: QuoteStore, address: Address | null): StoreOrder {
  return {
    store: cartStore.store,
    status: "pending_payment",
    fulfillment: quoteStore.fulfillment,
    pickup_code: null,
    address:
      quoteStore.fulfillment === "delivery" && address !== null
        ? {
            label: address.label,
            recipient_name: address.recipient_name,
            phone: address.phone,
            city: address.city,
            line: address.line,
            reference: address.reference,
          }
        : null,
    lines: okLines(cartStore).map(toOrderLine),
    subtotal_usd: quoteStore.subtotal_usd,
    subtotal_ves: quoteStore.subtotal_ves,
    delivery_fee_usd: quoteStore.delivery_fee_usd,
    delivery_fee_ves: quoteStore.delivery_fee_ves,
    refunded_usd: ZERO,
    refunded_ves: ZERO,
    timeline: { paid_at: null, ready_at: null, dispatched_at: null, delivered_at: null, cancelled_at: null },
  };
}

// Código de `length` caracteres del alfabeto, derivado de `seed` (determinista, como el resto del
// simulado).
function alphabetCode(seed: string, length: number): string {
  const digest = createHash("sha256").update(seed).digest();
  return Array.from(digest.subarray(0, length), (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

// 8 caracteres, único entre las compras simuladas.
function purchaseCode(sequence: number, taken: Map<string, MockPurchase>): string {
  for (let attempt = 0; ; attempt += 1) {
    const code = alphabetCode(`compra:${sequence}:${attempt}`, 8);
    if (!taken.has(code)) return code;
  }
}

export async function startCheckout(ctx: AccountContext, input: CheckoutInput): Promise<CheckoutStart> {
  const account = mockAccountFor(ctx);
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) throw accountError("validation_failed", { stores: "Revisa los datos del checkout." });
  const { quote_hash, idempotency_key, bill_to_me, ...quoteInput } = parsed.data;

  const current = state();
  const startedKey = `${account.id}:${idempotency_key}`;
  const repeated = current.started.get(startedKey);
  if (repeated !== undefined) return structuredClone(repeated);

  if (!account.customer.email_verified) throw accountError("email_unverified");
  if (bill_to_me === true && account.customer.billing === null) throw accountError("billing_incomplete");
  const quoted = buildQuote(ctx, quoteInput);
  if (quoted.quote.quote_hash !== quote_hash) throw accountError("quote_changed", null, quoted.quote);

  const sequence = current.nextSequence++;
  const code = purchaseCode(sequence, current.purchases);
  const orders = quoted.quote.stores.map((quoteStore) => {
    const cartStore = quoted.stores.find((entry) => entry.store.slug === quoteStore.store_slug);
    if (cartStore === undefined) throw new Error(`Tienda cotizada sin carrito: ${quoteStore.store_slug}`);
    return toOrder(cartStore, quoteStore, quoted.address);
  });
  current.purchases.set(code, {
    customerId: account.id,
    sequence,
    failsPayment: account.customer.email === MOCK_FAILED_PAYMENT_EMAIL,
    bought: orders.flatMap((order) =>
      order.lines.map((line) => ({ store_slug: order.store.slug, product_slug: line.product.slug })),
    ),
    consultations: 0,
    purchase: {
      code,
      status: "pending_payment",
      created_at: new Date().toISOString(),
      paid_at: null,
      total_usd: quoted.quote.total_usd,
      total_ves: quoted.quote.total_ves,
      charge: quoted.quote.charge,
      rate: quoted.quote.rate,
      orders,
    },
  });
  const started: CheckoutStart = {
    purchase_code: code,
    payment: {
      provider: "fake",
      redirect_url: `${SITE_URL}/checkout/resultado?compra=${code}`,
      instructions: null,
    },
  };
  current.started.set(startedKey, started);
  return structuredClone(started);
}

function isMissing(storeSlug: string, line: StoreOrderLine): boolean {
  return storeSlug === MOCK_MISSING_LINE.store_slug && line.product.slug === MOCK_MISSING_LINE.product_slug;
}

// Pago confirmado: los pedidos pasan a `accepted`, la línea faltante se reembolsa al instante
// (spec §5.5) y el carrito pierde las líneas compradas (§5.3 paso 4). Pago fallido: los pedidos se
// cancelan y el carrito queda igual (enmienda L).
function settle(record: MockPurchase): void {
  const purchase = record.purchase;
  const now = new Date().toISOString();
  if (record.failsPayment) {
    purchase.status = "failed";
    for (const order of purchase.orders) {
      order.status = "cancelled";
      order.timeline.cancelled_at = now;
    }
    return;
  }
  purchase.status = "paid";
  purchase.paid_at = now;
  for (const order of purchase.orders) {
    order.status = "accepted";
    order.timeline.paid_at = now;
    for (const line of order.lines) {
      if (!isMissing(order.store.slug, line)) continue;
      line.missing = true;
      line.accepted_quantity = 0;
    }
    const missing = order.lines.filter((line) => line.missing);
    order.refunded_usd = sum(missing.map((line) => line.line_usd));
    order.refunded_ves = sum(missing.map((line) => line.line_ves));
    if (missing.length === order.lines.length) {
      order.status = "cancelled";
      order.timeline.cancelled_at = now;
    }
  }
  removeCartLines(record.customerId, record.bought);
}

function prepare(record: MockPurchase): void {
  const now = new Date().toISOString();
  for (const order of record.purchase.orders) {
    if (order.status !== "accepted") continue;
    if (order.fulfillment === "pickup") {
      order.status = "ready_for_pickup";
      order.pickup_code = pickupCode(record.purchase.code, order.store.slug);
      order.timeline.ready_at = now;
    } else {
      order.status = "out_for_delivery";
      order.timeline.dispatched_at = now;
    }
  }
}

function pickupCode(code: string, storeSlug: string): string {
  return alphabetCode(`retiro:${code}:${storeSlug}`, 6);
}

export async function getPurchase(ctx: AccountContext, code: string): Promise<Purchase> {
  const id = customerIdFor(ctx);
  const record = state().purchases.get(code);
  if (record === undefined || record.customerId !== id) throw accountError("not_found");
  record.consultations += 1;
  if (record.purchase.status === "pending_payment" && record.consultations >= 2) settle(record);
  else if (record.purchase.status === "paid" && record.consultations >= 3) prepare(record);
  return structuredClone(record.purchase);
}

// El listado no cuenta consultas: sólo el detalle avanza la compra.
export async function listPurchases(ctx: AccountContext, page: number): Promise<PurchasePage> {
  const id = customerIdFor(ctx);
  const mine = [...state().purchases.values()]
    .filter((record) => record.customerId === id)
    .sort((a, b) => b.sequence - a.sequence);
  const safePage = Number.isInteger(page) && page >= 1 ? page : 1;
  const start = (safePage - 1) * PER_PAGE;
  return {
    data: mine.slice(start, start + PER_PAGE).map((record) => structuredClone(record.purchase)),
    meta: { page: safePage, per_page: PER_PAGE, total: mine.length },
  };
}

const BUY_AGAIN_LIMIT = 8;

// "Volver a comprar" (spec §4.2): un ítem por par tienda y producto de las compras pagadas, la más
// reciente primero, cotizado a una unidad con el precio y la disponibilidad de hoy. El récipe no
// entra y lo faltante de un pedido tampoco.
export async function getBuyAgain(ctx: AccountContext): Promise<BuyAgainResponse> {
  const id = customerIdFor(ctx);
  const paid = [...state().purchases.values()]
    .filter((record) => record.customerId === id && record.purchase.status === "paid")
    .sort((a, b) => (b.purchase.paid_at ?? "").localeCompare(a.purchase.paid_at ?? "") || b.sequence - a.sequence);
  const seen = new Set<string>();
  const data: BuyAgainItem[] = [];
  for (const record of paid) {
    for (const order of record.purchase.orders) {
      for (const line of order.lines) {
        const key = `${order.store.slug}:${line.product.slug}`;
        if (line.missing || seen.has(key)) continue;
        seen.add(key);
        const store = quoteItems([{ store_slug: order.store.slug, product_slug: line.product.slug, quantity: 1 }]).stores[0];
        const quoted = store?.lines[0];
        if (store === undefined || quoted === undefined || quoted.unavailable_reason === "restricted") continue;
        if (data.length >= BUY_AGAIN_LIMIT) continue;
        data.push({
          product: quoted.product,
          store: store.store,
          price_usd: quoted.price_usd,
          price_ves: quoted.price_ves,
          availability: quoted.availability,
          status: quoted.status,
          unavailable_reason: quoted.unavailable_reason,
          last_purchased_at: record.purchase.paid_at ?? record.purchase.created_at,
        });
      }
    }
  }
  return { data, rate: MOCK_RATE };
}

const OPEN_ORDER_STATUSES = new Set<StoreOrder["status"]>(["accepted", "ready_for_pickup", "out_for_delivery"]);

// Pedidos abiertos bloquean eliminar la cuenta (spec §5.8). Sólo cuentan compras pagadas.
export function hasOpenOrders(customerId: number): boolean {
  return [...state().purchases.values()].some(
    (record) =>
      record.customerId === customerId &&
      record.purchase.status === "paid" &&
      record.purchase.orders.some((order) => OPEN_ORDER_STATUSES.has(order.status)),
  );
}
