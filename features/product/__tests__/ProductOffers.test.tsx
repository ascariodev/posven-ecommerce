import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEffectiveLocation } from "@/features/location/server/location";
import { getProductOffers } from "@/lib/marketplace/client";
import type { ProductOffer, ProductPage } from "@/lib/marketplace/schemas";
import { ProductOffers } from "@/features/product/components/ProductOffers";

vi.mock("@/lib/marketplace/client", () => ({
  getProductOffers: vi.fn(),
}));

vi.mock("@/features/cart/server/actions", () => ({ addToCart: vi.fn() }));

vi.mock("@/features/location/server/location", () => ({
  getEffectiveLocation: vi.fn(async () => ({ location: null, name: null })),
}));

const product = {
  slug: "acetaminofen-500-mg-20-tabletas",
  name: "Acetaminofén 500 mg x 20 tabletas",
  restriction: "none" as const,
};

function offer(slug: string, name: string, overrides: Partial<ProductOffer> = {}): ProductOffer {
  return {
    store: {
      slug,
      name,
      logo_url: null,
      address: "Av. Bolívar Norte",
      city: { slug: "valencia", name: "Valencia" },
      latitude: 10.18,
      longitude: -68.0,
      phone: null,
      whatsapp: null,
      is_premium: false,
      accepts_orders: false,
    },
    price_usd: "2.50",
    price_ves: "91.25",
    availability: "available",
    updated_at: "2026-09-26T14:30:00Z",
    distance_km: null,
    outside_radius: false,
    ...overrides,
  };
}

function page(offers: ProductOffer[], featured: ProductOffer[]): ProductPage {
  return {
    data: {
      ...product,
      ean: null,
      brand: null,
      category: null,
      image_url: null,
      attributes: [],
      is_unified: true,
      offers_summary: { offer_count: offers.length + featured.length, low_price_usd: "2.35", high_price_usd: "2.80" },
    },
    featured,
    offers,
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

describe("ProductOffers", () => {
  it("las destacadas van primero con Destacado y las de fuera del radio bajo Fuera de tu zona", async () => {
    const premium = offer("farmacia-central-valencia", "Farmacia Central", { price_usd: "2.60" });
    const near = offer("abasto-la-esquina", "Abasto La Esquina", { price_usd: "2.50" });
    const far = offer("farmacia-altamira", "Farmacia Altamira", { price_usd: "2.70", outside_radius: true });
    vi.mocked(getProductOffers).mockResolvedValue(page([near, far], [premium]));

    render(await ProductOffers({ product, searchParams: searchParams({}) }));

    const items = within(screen.getByRole("list", { name: "Ofertas" })).getAllByRole("listitem");
    expect(within(items[0]).getByText("$ 2,60")).toBeTruthy();
    expect(within(items[0]).getByText("Destacado")).toBeTruthy();
    expect(within(items[1]).getByText("$ 2,50")).toBeTruthy();
    expect(within(items[1]).queryByText("Destacado")).toBeNull();

    expect(screen.getByRole("heading", { level: 3, name: "Fuera de tu zona" })).toBeTruthy();
    const outside = screen.getByRole("list", { name: "Fuera de tu zona" });
    expect(within(outside).getByText("$ 2,70")).toBeTruthy();
  });

  it("muestra tres ofertas del radio y deja las demás tras Ver N tiendas más", async () => {
    const inside = ["a", "b", "c", "d", "e"].map((slug) => offer(`tienda-${slug}`, `Tienda ${slug}`));
    vi.mocked(getProductOffers).mockResolvedValue(page(inside, []));

    render(await ProductOffers({ product, searchParams: searchParams({}) }));

    const items = within(screen.getByRole("list", { name: "Ofertas" })).getAllByRole("listitem");
    expect(items.map((item) => within(item).getByRole("link", { name: /^Tienda / }).textContent)).toEqual([
      "Tienda a",
      "Tienda b",
      "Tienda c",
    ]);
    expect(screen.getByText("Ver 2 tiendas más").tagName).toBe("SUMMARY");
    const more = within(screen.getByRole("list", { name: "Más ofertas" })).getAllByRole("listitem");
    expect(more).toHaveLength(2);
  });

  it("sin ubicación no ofrece Más cerca y pide sort price aunque venga orden=cerca", async () => {
    vi.mocked(getProductOffers).mockResolvedValue(page([offer("abasto-la-esquina", "Abasto La Esquina")], []));

    render(await ProductOffers({ product, searchParams: searchParams({ orden: "cerca" }) }));

    expect(screen.queryByText("Más cerca")).toBeNull();
    expect(getProductOffers).toHaveBeenCalledWith({
      slug: product.slug,
      geo: null,
      radiusKm: null,
      sort: "price",
    });
  });

  it("con coordenadas y orden=cerca pide sort distance y radiusKm 10", async () => {
    vi.mocked(getEffectiveLocation).mockResolvedValueOnce({
      location: { kind: "coords", lat: 10.18, lng: -68.0 },
      name: "Tu ubicación actual",
    });
    vi.mocked(getProductOffers).mockResolvedValue(page([offer("abasto-la-esquina", "Abasto La Esquina")], []));

    render(await ProductOffers({ product, searchParams: searchParams({ orden: "cerca" }) }));

    expect(getProductOffers).toHaveBeenCalledWith({
      slug: product.slug,
      geo: { lat: 10.18, lng: -68.0 },
      radiusKm: 10,
      sort: "distance",
    });
    expect(screen.getByRole("link", { name: "Más cerca" }).getAttribute("aria-current")).toBe("true");
  });

  it("marca Mejor precio sólo donde la API manda is_best_price, sea cual sea la posición", async () => {
    const first = offer("abasto-la-esquina", "Abasto La Esquina", { price_usd: "2.70", is_best_price: false });
    const second = offer("farmacia-altamira", "Farmacia Altamira", { price_usd: "2.50", is_best_price: true });
    vi.mocked(getProductOffers).mockResolvedValue(page([first, second], []));

    render(await ProductOffers({ product, searchParams: searchParams({}) }));

    expect(screen.getAllByText("Mejor precio")).toHaveLength(1);
    const items = within(screen.getByRole("list", { name: "Ofertas" })).getAllByRole("listitem");
    expect(within(items[0]).queryByText("Mejor precio")).toBeNull();
    expect(within(items[1]).getByText("Mejor precio")).toBeTruthy();
  });

  it("una destacada con is_best_price lleva Mejor precio y sin el campo nadie lo lleva", async () => {
    const premium = offer("farmacia-central-valencia", "Farmacia Central", { price_usd: "1.60", is_best_price: true });
    const first = offer("abasto-la-esquina", "Abasto La Esquina", { price_usd: "1.75" });
    vi.mocked(getProductOffers).mockResolvedValue(page([first], [premium]));

    render(await ProductOffers({ product, searchParams: searchParams({}) }));

    const items = within(screen.getByRole("list", { name: "Ofertas" })).getAllByRole("listitem");
    expect(within(items[0]).getByText("Mejor precio")).toBeTruthy();
    expect(within(items[1]).queryByText("Mejor precio")).toBeNull();
  });

  it("sin is_best_price en la respuesta no marca Mejor precio, ni en el orden Más cerca", async () => {
    vi.mocked(getEffectiveLocation).mockResolvedValueOnce({
      location: { kind: "coords", lat: 10.18, lng: -68.0 },
      name: "Tu ubicación actual",
    });
    vi.mocked(getProductOffers).mockResolvedValue(page([offer("abasto-la-esquina", "Abasto La Esquina")], []));

    render(await ProductOffers({ product, searchParams: searchParams({ orden: "cerca" }) }));

    expect(screen.queryByText("Mejor precio")).toBeNull();
  });

  it("con respuesta null pinta el texto de sin ofertas", async () => {
    vi.mocked(getProductOffers).mockResolvedValue(null);

    render(await ProductOffers({ product, searchParams: searchParams({}) }));

    expect(screen.getByText("No hay ofertas cerca.")).toBeTruthy();
  });
});

describe("botón Agregar al carrito en las ofertas (RN-CART-03)", () => {
  const seller = (overrides: Partial<ProductOffer> = {}) => {
    const base = offer("farmacia-central-valencia", "Farmacia Central", overrides);
    return { ...base, store: { ...base.store, accepts_orders: true } };
  };
  const addButtons = () => screen.queryAllByRole("button", { name: /^Agregar al carrito:/ });

  beforeEach(() => {
    vi.stubEnv("MARKETPLACE_MODE", "mock");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sale en una tienda que vende y un producto sin restricción, también en destacadas y fuera de zona", async () => {
    vi.mocked(getProductOffers).mockResolvedValue(page([seller(), seller({ outside_radius: true })], [seller()]));

    render(await ProductOffers({ product, searchParams: searchParams({}) }));

    expect(addButtons()).toHaveLength(3);
  });

  it("no sale en una tienda sin venta en línea", async () => {
    vi.mocked(getProductOffers).mockResolvedValue(page([offer("farmacia-naguanagua", "Farmacia Naguanagua")], []));

    render(await ProductOffers({ product, searchParams: searchParams({}) }));

    expect(addButtons()).toHaveLength(0);
  });

  it("no sale con un producto recipe", async () => {
    vi.mocked(getProductOffers).mockResolvedValue(page([seller()], []));

    render(await ProductOffers({ product: { ...product, restriction: "recipe" }, searchParams: searchParams({}) }));

    expect(addButtons()).toHaveLength(0);
  });

  it("sale con un producto controlled, que la API no restringe", async () => {
    vi.mocked(getProductOffers).mockResolvedValue(page([seller()], []));

    render(await ProductOffers({ product: { ...product, restriction: "controlled" }, searchParams: searchParams({}) }));

    expect(addButtons().length).toBeGreaterThan(0);
  });

  it("no sale con el interruptor apagado", async () => {
    vi.stubEnv("MARKETPLACE_MODE", "api");
    vi.stubEnv("MARKETPLACE_CART_ENABLED", undefined);
    vi.mocked(getProductOffers).mockResolvedValue(page([seller()], []));

    render(await ProductOffers({ product, searchParams: searchParams({}) }));

    expect(addButtons()).toHaveLength(0);
  });

  describe("tienda por defecto de la barra de compra", () => {
    const barStore = () => within(screen.getByRole("region", { name: "Compra" }));
    const closed = (slug: string, name: string, overrides: Partial<ProductOffer> = {}) => offer(slug, name, overrides);
    const open = (slug: string, name: string, overrides: Partial<ProductOffer> = {}) => {
      const base = offer(slug, name, overrides);
      return { ...base, store: { ...base.store, accepts_orders: true } };
    };

    it("salta la de is_best_price que no recibe pedidos y toma la que sí, también marcada", async () => {
      vi.mocked(getProductOffers).mockResolvedValue(
        page(
          [
            closed("sin-pedidos", "Sin Pedidos", { is_best_price: true }),
            open("segunda", "Segunda Tienda"),
            open("tercera", "Tercera Tienda", { is_best_price: true }),
          ],
          [],
        ),
      );

      render(await ProductOffers({ product, searchParams: searchParams({}) }));

      expect(barStore().getByText("Tercera Tienda")).toBeTruthy();
    });

    it("sin is_best_price que acepte pedidos, toma la primera servida que acepte", async () => {
      vi.mocked(getProductOffers).mockResolvedValue(
        page(
          [closed("sin-pedidos", "Sin Pedidos", { is_best_price: true }), open("segunda", "Segunda Tienda")],
          [],
        ),
      );

      render(await ProductOffers({ product, searchParams: searchParams({}) }));

      expect(barStore().getByText("Segunda Tienda")).toBeTruthy();
    });

    it("si ninguna acepta pedidos, conserva la de is_best_price", async () => {
      vi.mocked(getProductOffers).mockResolvedValue(
        page([closed("primera", "Primera Tienda"), closed("mejor", "Mejor Tienda", { is_best_price: true })], []),
      );

      render(await ProductOffers({ product, searchParams: searchParams({}) }));

      expect(barStore().getByText("Mejor Tienda")).toBeTruthy();
    });
  });
});
