import { afterEach, describe, expect, it, vi } from "vitest";
import { getCart, quoteGuestCart } from "@/lib/marketplace/client";
import type { Cart } from "@/lib/marketplace/schemas";
import { accountContext } from "@/features/account/server/session";
import { getCurrentCart, getSessionCart } from "@/features/cart/server/cart";
import { readGuestCart } from "@/features/cart/server/cookie";

vi.mock("@/lib/marketplace/client", () => ({ getCart: vi.fn(), quoteGuestCart: vi.fn(), mergeCart: vi.fn() }));
vi.mock("@/features/account/server/session", () => ({ accountContext: vi.fn() }));
vi.mock("@/features/cart/server/cookie", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/cart/server/cookie")>()),
  readGuestCart: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

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

afterEach(() => {
  for (const memo of memos) memo.clear();
  vi.mocked(getCart).mockReset();
  vi.mocked(quoteGuestCart).mockReset();
  vi.mocked(accountContext).mockReset();
  vi.mocked(readGuestCart).mockReset();
});

describe("getCurrentCart", () => {
  it("con sesión pide el carrito con las tiendas con entrega", async () => {
    vi.mocked(accountContext).mockResolvedValue({ session: "7|token", clientIp: null });
    vi.mocked(getCart).mockResolvedValue(cart);
    await getCurrentCart("abasto-la-esquina,farmacia-central-valencia");
    expect(getCart).toHaveBeenCalledWith(expect.anything(), ["abasto-la-esquina", "farmacia-central-valencia"]);
  });

  it("sin elección pide el carrito sin tiendas con entrega", async () => {
    vi.mocked(accountContext).mockResolvedValue({ session: "7|token", clientIp: null });
    vi.mocked(getCart).mockResolvedValue(cart);
    await getCurrentCart();
    expect(getCart).toHaveBeenCalledWith(expect.anything(), []);
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
    expect(quoteGuestCart).toHaveBeenCalledWith(expect.anything(), [item], ["farmacia-central-valencia"]);
  });
});
