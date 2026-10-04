import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import type { AccountContext } from "@/lib/marketplace/params";
import type { CartItem } from "@/lib/marketplace/schemas";
import { loginCustomer, resetMockAccounts } from "@/lib/marketplace/mock/accounts";
import { MOCK_PRODUCTS, MOCK_RATE } from "@/lib/marketplace/mock/fixtures";
import { getCart, mergeCart, quoteGuestCart, resetMockCarts, setCartItem } from "@/lib/marketplace/mock/cart";

const anonymous: AccountContext = { session: null, clientIp: null };

// Tiendas del simulado: farmacia-central-valencia y abasto-la-esquina venden en línea;
// farmacia-naguanagua no. El arroz está "low" (stock simulado 3) en abasto-la-esquina.
const ACETAMINOFEN = "acetaminofen-500-mg-20-tabletas";
const CENTRAL = "farmacia-central-valencia";

function item(store_slug: string, product_slug: string, quantity = 1): CartItem {
  return { store_slug, product_slug, quantity };
}

async function session(): Promise<AccountContext> {
  const { token } = await loginCustomer(anonymous, { email: "comprador@posven.test", password: "clave-segura-1" });
  return { session: token, clientIp: null };
}

async function errorCode(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );
  if (!(error instanceof MarketplaceAccountError)) throw new Error("se esperaba MarketplaceAccountError");
  return error.code;
}

beforeEach(() => {
  resetMockAccounts();
  resetMockCarts();
});

describe("cotización del carrito simulado", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("cada tienda lleva closes_at calculado del horario con el reloj simulado", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-04T14:00:00Z") });
    const sunday = await quoteGuestCart(anonymous, [item(CENTRAL, ACETAMINOFEN)]);
    expect(sunday.stores[0].closes_at).toBe("13:00");
    vi.setSystemTime(new Date("2026-10-05T10:00:00Z"));
    const monday = await quoteGuestCart(anonymous, [item(CENTRAL, ACETAMINOFEN)]);
    expect(monday.stores[0].closes_at).toBe("20:00");
  });

  it("vacío: sin tiendas, totales en cero y line_count 0", async () => {
    const cart = await quoteGuestCart(anonymous, []);
    expect(cart).toEqual({ stores: [], total_usd: "0.00", total_ves: "0.00", line_count: 0, rate: MOCK_RATE });
  });

  it("suma sólo las líneas ok: la de una tienda que no vende sale unavailable y no suma", async () => {
    const cart = await quoteGuestCart(anonymous, [item(CENTRAL, ACETAMINOFEN, 2), item("farmacia-naguanagua", ACETAMINOFEN)]);
    const [central, naguanagua] = cart.stores;
    expect(central.lines[0]).toMatchObject({ status: "ok", line_usd: "5.00", line_ves: "182.50", availability: "available" });
    expect(naguanagua.lines[0]).toMatchObject({
      status: "unavailable",
      unavailable_reason: "store_not_selling",
      availability: null,
    });
    expect(naguanagua.subtotal_usd).toBe("0.00");
    expect(cart).toMatchObject({ total_usd: "5.00", total_ves: "182.50", line_count: 1 });
  });

  it("una oferta que ya no existe sale offer_gone con montos nulos", async () => {
    const cart = await quoteGuestCart(anonymous, [item(CENTRAL, "jarabe-para-la-tos-120-ml")]);
    expect(cart.stores[0].lines[0]).toMatchObject({
      status: "unavailable",
      unavailable_reason: "offer_gone",
      price_usd: null,
      line_usd: null,
    });
  });

  it("un producto restringido sale unavailable en la cotización, sin error", async () => {
    const cart = await quoteGuestCart(anonymous, [item(CENTRAL, "amoxicilina-500-mg-21-capsulas")]);
    expect(cart.stores[0].lines[0]).toMatchObject({ status: "unavailable", unavailable_reason: "restricted" });
  });

  it("omite tiendas y productos inexistentes", async () => {
    const cart = await quoteGuestCart(anonymous, [item("no-existe", ACETAMINOFEN), item(CENTRAL, "no-existe")]);
    expect(cart.stores).toEqual([]);
  });

  it("rechaza más de 20 entradas con validation_failed", async () => {
    const items = Array.from({ length: 21 }, (_, index) => item(CENTRAL, `producto-${index}`));
    expect(await errorCode(quoteGuestCart(anonymous, items))).toBe("validation_failed");
  });
});

describe("carrito del comprador simulado", () => {
  it("PUT agrega con techo de stock", async () => {
    const ctx = await session();
    const cart = await setCartItem(ctx, item(CENTRAL, ACETAMINOFEN, 99));
    expect(cart.stores[0].lines[0].quantity).toBe(50);
    expect(cart.line_count).toBe(1);
    const low = await setCartItem(ctx, item("abasto-la-esquina", "arroz-blanco-tipo-i-1-kg", 5));
    expect(low.stores[1].lines[0].quantity).toBe(3);
  });

  it("PUT con un campo mal formado responde validation_failed con el campo", async () => {
    const ctx = await session();
    const error = await setCartItem(ctx, { store_slug: "", product_slug: ACETAMINOFEN, quantity: 1 }).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(MarketplaceAccountError);
    expect((error as MarketplaceAccountError).fields).toEqual({ store_slug: "Elige una tienda válida." });
  });

  it.each(["amoxicilina-500-mg-21-capsulas", "clonazepam-0-5-mg-30-tabletas"])(
    "PUT de un producto restringido (%s) responde product_restricted",
    async (product) => {
      const ctx = await session();
      expect(await errorCode(setCartItem(ctx, item(CENTRAL, product)))).toBe("product_restricted");
    },
  );

  it("PUT en una tienda que no vende responde not_orderable", async () => {
    const ctx = await session();
    expect(await errorCode(setCartItem(ctx, item("farmacia-naguanagua", ACETAMINOFEN)))).toBe("not_orderable");
  });

  it("merge topa en 20 líneas sin error (enmienda K) y el PUT de la 21 responde cart_full", async () => {
    const ctx = await session();
    const slugs = MOCK_PRODUCTS.map((entry) => entry.product.slug).filter((slug) => slug !== ACETAMINOFEN);
    await mergeCart(ctx, slugs.slice(0, 15).map((slug) => item("ferreteria-el-tornillo", slug)));
    const merged = await mergeCart(ctx, slugs.slice(15, 24).map((slug) => item("ferreteria-el-tornillo", slug)));
    const mergedSlugs = merged.stores.flatMap((store) => store.lines.map((line) => line.product.slug));
    expect(mergedSlugs).toEqual(slugs.slice(0, 20));
    expect(await errorCode(setCartItem(ctx, item(CENTRAL, ACETAMINOFEN)))).toBe("cart_full");
  });

  it("PUT con cantidad 0 borra aunque la línea ya no se pueda comprar (enmienda J)", async () => {
    const ctx = await session();
    await mergeCart(ctx, [item("farmacia-naguanagua", ACETAMINOFEN), item(CENTRAL, "jarabe-para-la-tos-120-ml")]);
    expect((await getCart(ctx)).stores).toHaveLength(2);
    await setCartItem(ctx, item("farmacia-naguanagua", ACETAMINOFEN, 0));
    const cart = await setCartItem(ctx, item(CENTRAL, "jarabe-para-la-tos-120-ml", 0));
    expect(cart.stores).toEqual([]);
  });

  it("merge suma las cantidades de la misma línea con techo de stock", async () => {
    const ctx = await session();
    await setCartItem(ctx, item(CENTRAL, ACETAMINOFEN, 2));
    const cart = await mergeCart(ctx, [item(CENTRAL, ACETAMINOFEN, 3), item("abasto-la-esquina", ACETAMINOFEN, 1)]);
    expect(cart.stores.map((store) => store.lines[0].quantity)).toEqual([5, 1]);
    const capped = await mergeCart(ctx, [item(CENTRAL, ACETAMINOFEN, 99)]);
    expect(capped.stores[0].lines[0].quantity).toBe(50);
  });

  it("sin sesión responde unauthenticated", async () => {
    expect(await errorCode(getCart(anonymous))).toBe("unauthenticated");
  });
});
