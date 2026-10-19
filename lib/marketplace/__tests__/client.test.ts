import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/lib/marketplace/http", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/marketplace/http")>()),
  accountRequest: vi.fn(),
  requestJson: vi.fn(),
}));

import { getCart, getPlacements, quoteGuestCart } from "@/lib/marketplace/client";
import { accountRequest, requestJson } from "@/lib/marketplace/http";
import { placementsResponseSchema } from "@/lib/marketplace/schemas";

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

  it("getCart manda lat y lng en la consulta cuando hay ubicación", async () => {
    await getCart(ctx, [], { lat: 10.18, lng: -68.0 });
    const query = lastRequest().query;
    expect(query?.get("lat")).toBe("10.18");
    expect(query?.get("lng")).toBe("-68");
  });

  it("quoteGuestCart manda lat y lng en el cuerpo cuando hay ubicación", async () => {
    await quoteGuestCart(ctx, items, [], { lat: 10.18, lng: -68.0 });
    expect(lastRequest().body).toEqual({ items, lat: 10.18, lng: -68 });
  });

  it("quoteGuestCart sin elección manda sólo items", async () => {
    await quoteGuestCart(ctx, items);
    expect(lastRequest().body).toEqual({ items });
  });
});

describe("client: espacios publicitarios", () => {
  it("getPlacements consulta /placements con la página, la ubicación y el filtro", async () => {
    vi.mocked(requestJson).mockResolvedValue({ slots: {} } as never);
    await getPlacements({ page: "search", geo: { city: "valencia" }, radiusKm: 10, category: "alimentos" });
    const [path, query, schema] = vi.mocked(requestJson).mock.calls[0];
    expect(path).toBe("/placements");
    expect(query.get("page")).toBe("search");
    expect(query.get("city")).toBe("valencia");
    expect(query.get("category")).toBe("alimentos");
    expect(schema).toBe(placementsResponseSchema);
  });

  it("getPlacements en modo simulado devuelve una pieza por espacio de la página", async () => {
    vi.stubEnv("MARKETPLACE_MODE", "mock");
    const response = await getPlacements({ page: "product", geo: null, radiusKm: null });
    expect(Object.keys(response.slots)).toEqual(["product_banner"]);
    expect(requestJson).not.toHaveBeenCalled();
  });
});
