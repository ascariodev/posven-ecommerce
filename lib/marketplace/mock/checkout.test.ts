import { beforeEach, describe, expect, it } from "vitest";
import { MarketplaceAccountError } from "../errors";
import type { AccountContext } from "../params";
import type { CheckoutQuoteInput, Fulfillment } from "../schemas";
import { loginCustomer, registerCustomer, resetMockAccounts } from "./accounts";
import { deleteAccount } from "./adapter";
import { cartItemsFor, resetMockCarts, setCartItem } from "./cart";
import {
  getPurchase,
  hasOpenOrders,
  listPurchases,
  quoteCheckout,
  resetMockPurchases,
  startCheckout,
} from "./checkout";

const anonymous: AccountContext = { session: null, clientIp: null };

// Tiendas del simulado: farmacia-central-valencia reparte en 5 km (envío 1.50 / 54.75);
// farmacia-altamira reparte en Caracas; abasto-la-esquina no reparte. La dirección 2 de
// entrega@posven.test está a 1,2 km de farmacia-central-valencia.
const CENTRAL = "farmacia-central-valencia";
const ALTAMIRA = "farmacia-altamira";
const ABASTO = "abasto-la-esquina";
const ACETAMINOFEN = "acetaminofen-500-mg-20-tabletas";
const ALCOHOL = "alcohol-isopropilico-250-ml";
const HARINA = "harina-de-maiz-precocida-1-kg";
const DELIVERY_ADDRESS_ID = 2;
// Código de compra: 8 caracteres del alfabeto sin 0, O, 1, I ni L (enmienda L).
const PURCHASE_CODE = /^[A-HJKMNP-Z2-9]{8}$/;

async function signIn(email: string, password: string): Promise<AccountContext> {
  const { token } = await loginCustomer(anonymous, { email, password });
  return { session: token, clientIp: null };
}

const buyer = () => signIn("comprador@posven.test", "clave-segura-1");
const deliveryBuyer = () => signIn("entrega@posven.test", "clave-segura-3");
const failingBuyer = () => signIn("pago-fallido@posven.test", "clave-segura-3");

async function add(ctx: AccountContext, store_slug: string, product_slug: string, quantity = 1): Promise<void> {
  await setCartItem(ctx, { store_slug, product_slug, quantity });
}

function input(
  stores: [string, Fulfillment][],
  address_id: number | null = null,
): CheckoutQuoteInput {
  return { stores: stores.map(([store_slug, fulfillment]) => ({ store_slug, fulfillment })), address_id };
}

async function pay(ctx: AccountContext, quoteInput: CheckoutQuoteInput, idempotency_key = crypto.randomUUID()) {
  const quote = await quoteCheckout(ctx, quoteInput);
  return startCheckout(ctx, { ...quoteInput, quote_hash: quote.quote_hash, idempotency_key });
}

async function accountError(promise: Promise<unknown>): Promise<MarketplaceAccountError> {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );
  if (!(error instanceof MarketplaceAccountError)) throw new Error("se esperaba MarketplaceAccountError");
  return error;
}

beforeEach(() => {
  resetMockAccounts();
  resetMockCarts();
  resetMockPurchases();
});

describe("cotización del checkout simulado", () => {
  it("retiro: envío en cero y totales de la tienda", async () => {
    const ctx = await deliveryBuyer();
    await add(ctx, CENTRAL, ACETAMINOFEN, 2);

    const quote = await quoteCheckout(ctx, input([[CENTRAL, "pickup"]], DELIVERY_ADDRESS_ID));

    expect(quote.stores).toEqual([
      {
        store_slug: CENTRAL,
        fulfillment: "pickup",
        delivery_available: true,
        delivery_unavailable_reason: null,
        subtotal_usd: "5.00",
        subtotal_ves: "182.50",
        delivery_fee_usd: "0.00",
        delivery_fee_ves: "0.00",
        total_usd: "5.00",
        total_ves: "182.50",
      },
    ]);
    expect(quote.charge).toEqual({ currency: "VES", amount: "182.50" });
  });

  it("entrega dentro del radio suma el envío de la tienda", async () => {
    const ctx = await deliveryBuyer();
    await add(ctx, CENTRAL, ACETAMINOFEN, 2);

    const quote = await quoteCheckout(ctx, input([[CENTRAL, "delivery"]], DELIVERY_ADDRESS_ID));

    expect(quote.stores[0]).toMatchObject({
      fulfillment: "delivery",
      delivery_fee_usd: "1.50",
      delivery_fee_ves: "54.75",
      total_usd: "6.50",
      total_ves: "237.25",
    });
    expect(quote.total_usd).toBe("6.50");
    expect(quote.charge).toEqual({ currency: "VES", amount: "237.25" });
  });

  it("sin reparto o fuera de radio cae a retiro con su motivo, sin error", async () => {
    const ctx = await deliveryBuyer();
    await add(ctx, ALTAMIRA, ACETAMINOFEN);
    await add(ctx, ABASTO, HARINA);

    const quote = await quoteCheckout(
      ctx,
      input([[ALTAMIRA, "delivery"], [ABASTO, "delivery"]], DELIVERY_ADDRESS_ID),
    );

    expect(quote.stores.map((store) => [store.fulfillment, store.delivery_unavailable_reason])).toEqual([
      ["pickup", "out_of_radius"],
      ["pickup", "no_delivery"],
    ]);
    expect(quote.total_usd).toBe("4.00");
  });

  it("sin dirección, la entrega sale no disponible por no_address", async () => {
    const ctx = await deliveryBuyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);

    const quote = await quoteCheckout(ctx, input([[CENTRAL, "pickup"]]));

    expect(quote.stores[0]).toMatchObject({ delivery_available: false, delivery_unavailable_reason: "no_address" });
  });

  it.each([
    ["entrega sin dirección", input([[CENTRAL, "delivery"]])],
    ["una dirección de otro comprador", input([[CENTRAL, "pickup"]], 1)],
  ])("%s responde validation_failed en address_id", async (_name, quoteInput) => {
    const ctx = await deliveryBuyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);

    const error = await accountError(quoteCheckout(ctx, quoteInput));

    expect(error.code).toBe("validation_failed");
    expect(error.fields).toEqual({ address_id: "Elige una dirección de entrega." });
  });

  it("sin líneas ok en las tiendas pedidas responde cart_empty", async () => {
    const ctx = await deliveryBuyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);

    const error = await accountError(quoteCheckout(ctx, input([[ABASTO, "pickup"]])));

    expect(error.code).toBe("cart_empty");
    expect(error.status).toBe(422);
  });
});

describe("checkout simulado", () => {
  it("con el correo sin verificar responde 403 email_unverified", async () => {
    const { token } = await registerCustomer(anonymous, {
      name: "Sin verificar",
      email: "sin-verificar@posven.test",
      phone: "+584141112233",
      password: "clave-segura-9",
    });
    const ctx = { session: token, clientIp: null };
    await add(ctx, CENTRAL, ACETAMINOFEN);

    const error = await accountError(pay(ctx, input([[CENTRAL, "pickup"]])));

    expect(error.code).toBe("email_unverified");
    expect(error.status).toBe(403);
  });

  it("con un quote_hash viejo responde 409 quote_changed con la Quote nueva", async () => {
    const ctx = await buyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);
    const quoteInput = input([[CENTRAL, "pickup"]]);
    const old = await quoteCheckout(ctx, quoteInput);
    await add(ctx, CENTRAL, ACETAMINOFEN, 3);

    const error = await accountError(
      startCheckout(ctx, { ...quoteInput, quote_hash: old.quote_hash, idempotency_key: crypto.randomUUID() }),
    );

    expect(error.code).toBe("quote_changed");
    expect(error.status).toBe(409);
    expect(error.quote?.total_usd).toBe("7.50");
    expect(error.quote?.quote_hash).not.toBe(old.quote_hash);
  });

  it("la misma idempotency_key devuelve la misma compra, sin una segunda", async () => {
    const ctx = await buyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);
    const key = crypto.randomUUID();

    const first = await pay(ctx, input([[CENTRAL, "pickup"]]), key);
    const second = await pay(ctx, input([[CENTRAL, "pickup"]]), key);

    expect(second).toEqual(first);
    expect(first.payment).toEqual({
      provider: "fake",
      redirect_url: `http://localhost:3000/checkout/resultado?compra=${first.purchase_code}`,
      instructions: null,
    });
    expect((await listPurchases(ctx, 1)).meta.total).toBe(1);
  });
});

describe("avance de la compra simulada por consultas", () => {
  it("pendiente, pagada con la línea faltante reembolsada, y lista para retirar", async () => {
    const ctx = await buyer();
    await add(ctx, CENTRAL, ACETAMINOFEN, 2);
    await add(ctx, CENTRAL, ALCOHOL);
    const { purchase_code } = await pay(ctx, input([[CENTRAL, "pickup"]]));

    expect(purchase_code).toMatch(PURCHASE_CODE);
    const pending = await getPurchase(ctx, purchase_code);
    expect(pending.status).toBe("pending_payment");
    expect(pending.orders.map((order) => order.status)).toEqual(["pending_payment"]);
    expect(cartItemsFor(1)).toHaveLength(2);

    const paid = await getPurchase(ctx, purchase_code);
    expect(paid.status).toBe("paid");
    const [order] = paid.orders;
    expect(order.status).toBe("accepted");
    expect(order.lines.map((line) => [line.product.slug, line.missing, line.accepted_quantity])).toEqual([
      [ACETAMINOFEN, false, 2],
      [ALCOHOL, true, 0],
    ]);
    expect([order.refunded_usd, order.refunded_ves]).toEqual(["1.60", "58.40"]);
    expect(order.pickup_code).toBeNull();
    expect(cartItemsFor(1)).toEqual([]);

    const ready = await getPurchase(ctx, purchase_code);
    expect(ready.orders[0].status).toBe("ready_for_pickup");
    expect(ready.orders[0].pickup_code).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
    expect(ready.orders[0].timeline.ready_at).not.toBeNull();
  });

  it("una entrega pasa a en camino, con la dirección sin id ni coordenadas", async () => {
    const ctx = await deliveryBuyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);
    const { purchase_code } = await pay(ctx, input([[CENTRAL, "delivery"]], DELIVERY_ADDRESS_ID));

    await getPurchase(ctx, purchase_code);
    await getPurchase(ctx, purchase_code);
    const moving = await getPurchase(ctx, purchase_code);

    expect(moving.orders[0].status).toBe("out_for_delivery");
    expect(moving.orders[0].pickup_code).toBeNull();
    expect(moving.orders[0].address).toEqual({
      label: "Oficina",
      recipient_name: "Comprador con entrega",
      phone: "+584141234569",
      city: { slug: "valencia", name: "Valencia" },
      line: "Av. Bolívar Norte, torre Delta, piso 5",
      reference: "Frente a la plaza",
    });
  });

  it("pago-fallido@posven.test termina en failed y el carrito queda igual", async () => {
    const ctx = await failingBuyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);
    const { purchase_code } = await pay(ctx, input([[CENTRAL, "pickup"]]));

    await getPurchase(ctx, purchase_code);
    const failed = await getPurchase(ctx, purchase_code);
    expect(failed.status).toBe("failed");
    expect(failed.orders.map((order) => order.status)).toEqual(["cancelled"]);
    expect(failed.orders[0].timeline.cancelled_at).not.toBeNull();
    expect(failed.orders[0].timeline.paid_at).toBeNull();
    expect((await getPurchase(ctx, purchase_code)).status).toBe("failed");
    expect(cartItemsFor(2)).toHaveLength(1);
  });

  it("un pedido con todas sus líneas faltantes queda cancelado", async () => {
    const ctx = await buyer();
    await add(ctx, CENTRAL, ALCOHOL);
    const { purchase_code } = await pay(ctx, input([[CENTRAL, "pickup"]]));

    await getPurchase(ctx, purchase_code);
    const paid = await getPurchase(ctx, purchase_code);

    expect(paid.orders[0].status).toBe("cancelled");
    expect(paid.orders[0].timeline.cancelled_at).not.toBeNull();
    expect(paid.orders[0].refunded_usd).toBe("1.60");
  });
});

describe("compras simuladas", () => {
  it("el listado va de 10 en 10, las más recientes primero, y no avanza el estado", async () => {
    const ctx = await buyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);
    const codes: string[] = [];
    for (let index = 0; index < 11; index += 1) codes.push((await pay(ctx, input([[CENTRAL, "pickup"]]))).purchase_code);

    const first = await listPurchases(ctx, 1);
    const second = await listPurchases(ctx, 2);
    await listPurchases(ctx, 1);

    expect(new Set(codes).size).toBe(11);
    expect(codes.every((code) => PURCHASE_CODE.test(code))).toBe(true);
    expect(first.data.map((purchase) => purchase.code)).toEqual(codes.slice(1).reverse());
    expect(first.meta).toEqual({ page: 1, per_page: 10, total: 11 });
    expect(second.data.map((purchase) => purchase.code)).toEqual([codes[0]]);
    expect((await listPurchases(ctx, 3)).data).toEqual([]);
    expect((await getPurchase(ctx, codes[0])).status).toBe("pending_payment");
  });

  it("el detalle de otro comprador o inexistente responde 404", async () => {
    const ctx = await buyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);
    const { purchase_code } = await pay(ctx, input([[CENTRAL, "pickup"]]));
    const other = await deliveryBuyer();

    expect((await accountError(getPurchase(other, purchase_code))).status).toBe(404);
    expect((await accountError(getPurchase(ctx, "NOEXISTE"))).code).toBe("not_found");
  });
});

describe("eliminar la cuenta con compras (spec §5.8)", () => {
  it("con un pedido abierto responde 409 open_orders y la cuenta sigue", async () => {
    const ctx = await buyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);
    const { purchase_code } = await pay(ctx, input([[CENTRAL, "pickup"]]));
    await getPurchase(ctx, purchase_code);
    await getPurchase(ctx, purchase_code);
    expect(hasOpenOrders(1)).toBe(true);

    const error = await accountError(deleteAccount(ctx, { password: "clave-segura-1" }));

    expect(error.code).toBe("open_orders");
    expect(error.status).toBe(409);
    await expect(buyer()).resolves.toBeTruthy();
  });

  it("sin pedidos abiertos borra la cuenta y su carrito", async () => {
    const ctx = await failingBuyer();
    await add(ctx, CENTRAL, ACETAMINOFEN);
    const { purchase_code } = await pay(ctx, input([[CENTRAL, "pickup"]]));
    await getPurchase(ctx, purchase_code);
    await getPurchase(ctx, purchase_code);

    await deleteAccount(ctx, { password: "clave-segura-3" });

    expect(cartItemsFor(2)).toEqual([]);
    expect((await accountError(failingBuyer())).code).toBe("invalid_credentials");
  });
});
