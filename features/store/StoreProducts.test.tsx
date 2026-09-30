import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getStore } from "@/lib/marketplace/client";
import type { StoreProduct, StoreResponse } from "@/lib/marketplace/schemas";
import { StoreProducts } from "./StoreProducts";

vi.mock("@/lib/marketplace/client", () => ({
  getStore: vi.fn(),
}));

const SLUG = "farmacia-central-valencia";

function product(slug: string, name: string, overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    slug,
    name,
    ean: null,
    brand: null,
    category: null,
    image_url: null,
    attributes: [],
    restriction: "none",
    is_unified: true,
    price_usd: "2.50",
    price_ves: "91.25",
    availability: "available",
    updated_at: "2026-09-26T14:30:00Z",
    ...overrides,
  };
}

function response(products: StoreProduct[], meta: StoreResponse["meta"]): StoreResponse {
  return {
    data: {
      slug: SLUG,
      name: "Farmacia Central",
      company_name: "Farmacia Central C.A.",
      logo_url: null,
      cover_url: null,
      address: "Av. Bolívar Norte",
      city: { slug: "valencia", name: "Valencia" },
      latitude: 10.18,
      longitude: -68.0,
      phone: null,
      whatsapp: null,
      is_premium: false,
      accepts_orders: false,
      schedule: [],
    },
    products,
    meta,
    rate: { usd_ves: "36.50", valid_on: "2026-09-26" },
  };
}

function searchParams(value: Record<string, string>) {
  return Promise.resolve(value);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StoreProducts", () => {
  it("pinta los productos con sus precios", async () => {
    vi.mocked(getStore).mockResolvedValue(
      response(
        [
          product("acetaminofen-500-mg-20-tabletas", "Acetaminofén 500 mg x 20 tabletas"),
          product("ibuprofeno-400-mg-10-tabletas", "Ibuprofeno 400 mg x 10 tabletas", {
            price_usd: "1.90",
            price_ves: "69.35",
          }),
        ],
        { page: 1, per_page: 20, total: 2 },
      ),
    );

    render(await StoreProducts({ slug: SLUG, searchParams: searchParams({}) }));

    expect(screen.getByRole("link", { name: "Acetaminofén 500 mg x 20 tabletas" }).getAttribute("href")).toBe(
      "/p/acetaminofen-500-mg-20-tabletas",
    );
    expect(screen.getByText("$ 2,50")).toBeTruthy();
    expect(screen.getByText("Bs 91,25")).toBeTruthy();
    expect(screen.getByText("$ 1,90")).toBeTruthy();
    expect(screen.getByText("Bs 69,35")).toBeTruthy();
  });

  it("en la página 1 de 2 hay Siguiente y no Anterior", async () => {
    vi.mocked(getStore).mockResolvedValue(
      response([product("acetaminofen-500-mg-20-tabletas", "Acetaminofén 500 mg x 20 tabletas")], {
        page: 1,
        per_page: 20,
        total: 25,
      }),
    );

    render(await StoreProducts({ slug: SLUG, searchParams: searchParams({}) }));

    expect(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")).toBe(`/tienda/${SLUG}?pagina=2`);
    expect(screen.queryByRole("link", { name: "Anterior" })).toBeNull();
  });

  it("pagina=abc pide la página 1", async () => {
    vi.mocked(getStore).mockResolvedValue(response([], { page: 1, per_page: 20, total: 0 }));

    render(await StoreProducts({ slug: SLUG, searchParams: searchParams({ pagina: "abc" }) }));

    expect(getStore).toHaveBeenCalledWith({ slug: SLUG, page: 1 });
  });
});
