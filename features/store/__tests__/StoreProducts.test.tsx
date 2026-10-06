import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStore } from "@/lib/marketplace/client";
import type { StoreProduct, StoreResponse } from "@/lib/marketplace/schemas";
import { StoreProducts } from "../components/StoreProducts";

vi.mock("@/lib/marketplace/client", () => ({
  getStore: vi.fn(),
}));

vi.mock("@/features/cart/server/actions", () => ({ addToCart: vi.fn() }));

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

function response(products: StoreProduct[], meta: StoreResponse["meta"], acceptsOrders = false): StoreResponse {
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
      accepts_orders: acceptsOrders,
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

describe("botón Agregar al carrito en la tienda (RN-CART-03)", () => {
  const meta = { page: 1, per_page: 20, total: 3 };
  const products = [
    product("acetaminofen-500-mg-20-tabletas", "Acetaminofén 500 mg x 20 tabletas"),
    product("amoxicilina-500-mg-21-capsulas", "Amoxicilina 500 mg", { restriction: "recipe" }),
    product("clonazepam-0-5-mg-30-tabletas", "Clonazepam 0,5 mg", { restriction: "controlled" }),
  ];
  const addButtons = () => screen.queryAllByRole("button", { name: /^Agregar al carrito:/ });

  beforeEach(() => {
    vi.stubEnv("MARKETPLACE_MODE", "mock");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sale en todos menos en los de récipe de una tienda que vende", async () => {
    vi.mocked(getStore).mockResolvedValue(response(products, meta, true));

    render(await StoreProducts({ slug: SLUG, searchParams: searchParams({}) }));

    expect(addButtons().map((button) => button.getAttribute("aria-label"))).toEqual([
      "Agregar al carrito: Acetaminofén 500 mg x 20 tabletas de Farmacia Central",
      "Agregar al carrito: Clonazepam 0,5 mg de Farmacia Central",
    ]);
  });

  it("no sale en una tienda sin venta en línea", async () => {
    vi.mocked(getStore).mockResolvedValue(response(products, meta, false));

    render(await StoreProducts({ slug: SLUG, searchParams: searchParams({}) }));

    expect(addButtons()).toHaveLength(0);
  });

  it("no sale con el interruptor apagado", async () => {
    vi.stubEnv("MARKETPLACE_MODE", "api");
    vi.stubEnv("MARKETPLACE_CART_ENABLED", undefined);
    vi.mocked(getStore).mockResolvedValue(response(products, meta, true));

    render(await StoreProducts({ slug: SLUG, searchParams: searchParams({}) }));

    expect(addButtons()).toHaveLength(0);
  });
});
