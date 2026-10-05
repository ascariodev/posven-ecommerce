import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/lib/marketplace/http", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/marketplace/http")>()),
  accountRequest: vi.fn(),
}));

import { getCart, quoteGuestCart } from "@/lib/marketplace/client";
import { accountRequest } from "@/lib/marketplace/http";

const ctx = { session: "token", clientIp: null };
const items = [{ product_slug: "alcohol-isopropilico-250-ml", store_slug: "farmacia-sur", quantity: 1 }];

function lastRequest() {
  return vi.mocked(accountRequest).mock.calls[0][0];
}

beforeEach(() => {
  vi.stubEnv("MARKETPLACE_MODE", "api");
  vi.mocked(accountRequest).mockResolvedValue({} as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("client: entrega elegida en el carrito", () => {
  it("getCart manda fulfillment[<slug>]=delivery en la consulta", async () => {
    await getCart(ctx, ["farmacia-sur"]);
    const request = lastRequest();
    expect(request).toMatchObject({ method: "GET", path: "/me/cart" });
    expect(request.query?.get("fulfillment[farmacia-sur]")).toBe("delivery");
  });

  it("getCart sin elección no manda parámetros nuevos", async () => {
    await getCart(ctx);
    expect(lastRequest().query?.toString()).toBe("");
  });

  it("quoteGuestCart manda fulfillment en el cuerpo", async () => {
    await quoteGuestCart(ctx, items, ["farmacia-sur"]);
    expect(lastRequest()).toMatchObject({
      method: "POST",
      path: "/cart/quote",
      body: { items, fulfillment: { "farmacia-sur": "delivery" } },
    });
  });

  it("quoteGuestCart sin elección manda sólo items", async () => {
    await quoteGuestCart(ctx, items);
    expect(lastRequest().body).toEqual({ items });
  });
});
