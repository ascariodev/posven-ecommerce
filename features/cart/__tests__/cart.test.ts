import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCart, quoteGuestCart } from "@/lib/marketplace/client";
import type { Cart } from "@/lib/marketplace/schemas";
import { accountContext } from "@/features/account/server/session";
import { getCurrentCart, getSessionCart } from "@/features/cart/server/cart";
import { readGuestCart } from "@/features/cart/server/cookie";
import { getUserLocation } from "@/features/location/server/location";

vi.mock("@/lib/marketplace/client", () => ({ getCart: vi.fn(), quoteGuestCart: vi.fn(), mergeCart: vi.fn() }));
vi.mock("@/features/account/server/session", () => ({ accountContext: vi.fn() }));
vi.mock("@/features/cart/server/cookie", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/cart/server/cookie")>()),
  readGuestCart: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/features/location/server/location", () => ({ getUserLocation: vi.fn() }));

const memos = vi.hoisted(() => [] as Map<string, unknown>[]);
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <A extends unknown[], R>(fn: (...args: A) => R) => {
    const memo = new Map<string, unknown>();
    memos.push(memo);
    return (...args: A): R => {
      const key = JSON.stringify(args);
      if (!memo.has(key)) memo.set(key, fn(...args));
      return memo.get(key) as R;
    };
  },
}));

const cart = { stores: [], total_usd: "0.00", total_ves: "0.00", line_count: 0 } as unknown as Cart;
const item = { store_slug: "farmacia-central-valencia", product_slug: "acetaminofen", quantity: 1 };

beforeEach(() => {
  vi.mocked(getUserLocation).mockResolvedValue(null);
});

afterEach(() => {
  for (const memo of memos) memo.clear();
  vi.mocked(getCart).mockReset();
  vi.mocked(quoteGuestCart).mockReset();
  vi.mocked(accountContext).mockReset();
  vi.mocked(readGuestCart).mockReset();
  vi.mocked(getUserLocation).mockReset();
});

describe("getCurrentCart", () => {
  it("con sesión pide el carrito con las tiendas con entrega", async () => {
    vi.mocked(accountContext).mockResolvedValue({ session: "7|token", clientIp: null });
    vi.mocked(getCart).mockResolvedValue(cart);
    await getCurrentCart("abasto-la-esquina,farmacia-central-valencia");
    expect(getCart).toHaveBeenCalledWith(expect.anything(), ["abasto-la-esquina", "farmacia-central-valencia"], null);
  });

  it("sin elección pide el carrito sin tiendas con entrega", async () => {
    vi.mocked(accountContext).mockResolvedValue({ session: "7|token", clientIp: null });
    vi.mocked(getCart).mockResolvedValue(cart);
    await getCurrentCart();
    expect(getCart).toHaveBeenCalledWith(expect.anything(), [], null);
  });

  it("sin elección comparte con el contador la lectura del carrito de la sesión", async () => {
    vi.mocked(accountContext).mockResolvedValue({ session: "7|token", clientIp: null });
    vi.mocked(getCart).mockResolvedValue(cart);
    await Promise.all([getSessionCart(), getCurrentCart()]);
    expect(getCart).toHaveBeenCalledTimes(1);
  });

  it("el invitado cotiza mp_cart con las tiendas con entrega", async () => {
    vi.mocked(accountContext).mockResolvedValue({ session: null, clientIp: null });
    vi.mocked(readGuestCart).mockResolvedValue([item]);
    vi.mocked(quoteGuestCart).mockResolvedValue(cart);
    await getCurrentCart("farmacia-central-valencia");
    expect(quoteGuestCart).toHaveBeenCalledWith(expect.anything(), [item], ["farmacia-central-valencia"], null);
  });
});

describe("distancia del carrito", () => {
  const coords = { kind: "coords", lat: 10.162, lng: -68.007 } as const;

  it("con sesión pasa la ubicación de la cookie a getCart", async () => {
    vi.mocked(accountContext).mockResolvedValue({ session: "7|token", clientIp: null });
    vi.mocked(getUserLocation).mockResolvedValue(coords);
    vi.mocked(getCart).mockResolvedValue(cart);
    await getCurrentCart();
    expect(getCart).toHaveBeenCalledWith(expect.anything(), [], { lat: 10.162, lng: -68.007 });
  });

  it("el invitado la pasa a quoteGuestCart", async () => {
    vi.mocked(accountContext).mockResolvedValue({ session: null, clientIp: null });
    vi.mocked(readGuestCart).mockResolvedValue([item]);
    vi.mocked(getUserLocation).mockResolvedValue({ kind: "city", city: "valencia" });
    vi.mocked(quoteGuestCart).mockResolvedValue(cart);
    await getCurrentCart();
    expect(quoteGuestCart).toHaveBeenCalledWith(expect.anything(), [item], [], { city: "valencia" });
  });
});
