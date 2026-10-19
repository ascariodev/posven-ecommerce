import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listNearbyProducts, searchProducts } from "@/lib/marketplace/client";
import { sendBeaconEvent } from "@/features/events/lib/beacon";
import { SearchResults } from "@/features/search/components/SearchResults";

vi.mock("@/lib/marketplace/client", () => ({
  searchProducts: vi.fn(),
  listCategories: vi.fn(async () => []),
  listNearbyProducts: vi.fn(async () => ({ data: [], meta: { page: 1, per_page: 12, total: 0 }, rate: { usd_ves: "36.5000", valid_on: "2026-10-04" } })),
}));

vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));

vi.mock("@/features/ads/components/SlotBanner", () => ({
  SlotBanner: ({ slot, scope }: { slot: string; scope?: { category?: string | null } }) => (
    <div data-testid={`slot-${slot}`} data-category={scope?.category ?? ""} />
  ),
}));

vi.mock("@/features/location/server/location", () => ({
  getEffectiveLocation: vi.fn(async () => ({ location: null, name: null })),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SearchResults", () => {
  it("sin q ni categoría pide escribir y no llama a searchProducts", async () => {
    render(await SearchResults({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Escribe qué buscas o elige una categoría.")).toBeTruthy();
    expect(searchProducts).not.toHaveBeenCalled();
  });

  it("pasa el orden de la URL a searchProducts y lo omite sin orden", async () => {
    vi.mocked(searchProducts).mockResolvedValue({
      data: [],
      featured: [],
      meta: { page: 1, per_page: 20, total: 0 },
      rate: { rate: "100.00", date: "2026-10-03" },
    } as unknown as Awaited<ReturnType<typeof searchProducts>>);
    render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz", orden: "precio" }) }));
    expect(vi.mocked(searchProducts).mock.calls[0]?.[0]).toMatchObject({ sort: "price" });
    cleanup();
    render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz" }) }));
    expect(vi.mocked(searchProducts).mock.calls[1]?.[0].sort).toBeUndefined();
    cleanup();
    render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz", orden: "cercania" }) }));
    expect(vi.mocked(searchProducts).mock.calls[2]?.[0].sort).toBeUndefined();
  });

  it("muestra el aviso de fuera de rango sólo con meta.out_of_range true", async () => {
    const result = (meta: Record<string, unknown>) =>
      ({
        data: [],
        featured: [],
        meta: { page: 1, per_page: 20, total: 0, ...meta },
        rate: { rate: "100.00", date: "2026-10-03" },
      }) as unknown as Awaited<ReturnType<typeof searchProducts>>;
    vi.mocked(searchProducts).mockResolvedValue(result({ out_of_range: true }));
    render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz" }) }));
    expect(screen.getByRole("status").textContent).toContain("fuera");
    cleanup();
    vi.mocked(searchProducts).mockResolvedValue(result({}));
    render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz" }) }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("pasa open_now a searchProducts sólo con abierto=1", async () => {
    vi.mocked(searchProducts).mockResolvedValue({
      data: [],
      featured: [],
      meta: { page: 1, per_page: 20, total: 0 },
      rate: { rate: "100.00", date: "2026-10-03" },
    } as unknown as Awaited<ReturnType<typeof searchProducts>>);
    render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz", abierto: "1" }) }));
    expect(vi.mocked(searchProducts).mock.calls[0]?.[0]).toMatchObject({ openNow: true });
    cleanup();
    render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz" }) }));
    expect(vi.mocked(searchProducts).mock.calls[1]?.[0].openNow).toBeUndefined();
  });

  it("con abierto=1 sin resultados pide productos cercanos abiertos y lo rotula", async () => {
    vi.mocked(searchProducts).mockResolvedValue({
      data: [],
      featured: [],
      meta: { page: 1, per_page: 20, total: 0 },
      rate: { rate: "100.00", date: "2026-10-03" },
    } as unknown as Awaited<ReturnType<typeof searchProducts>>);
    vi.mocked(listNearbyProducts).mockResolvedValue({
      data: [
        {
          slug: "arroz",
          name: "Arroz",
          ean: null,
          brand: null,
          category: null,
          image_url: null,
          attributes: [],
          restriction: "none",
          is_unified: true,
          offers_count: 1,
          min_price_usd: "1.00",
          min_price_ves: "36.50",
          nearest_km: null,
          outside_radius: false,
        },
      ],
      meta: { page: 1, per_page: 12, total: 1 },
      rate: { usd_ves: "36.5000", valid_on: "2026-10-04" },
    });
    render(await SearchResults({ searchParams: Promise.resolve({ q: "zzz", abierto: "1" }) }));
    expect(await screen.findByRole("heading", { name: "Quizás te sirve (abierto ahora)" })).toBeTruthy();
    expect(vi.mocked(listNearbyProducts).mock.calls.at(-1)?.[0]).toMatchObject({ openNow: true });
    cleanup();
    render(await SearchResults({ searchParams: Promise.resolve({ q: "zzz" }) }));
    expect(await screen.findByRole("heading", { name: "Quizás te sirve" })).toBeTruthy();
    expect(vi.mocked(listNearbyProducts).mock.calls.at(-1)?.[0].openNow).toBeUndefined();
  });

  describe("evento search", () => {
    function resultsFor(total: number) {
      return {
        data: [],
        featured: [],
        meta: { current_page: 1, last_page: 1, per_page: 20, total },
        rate: { rate: "100.00", date: "2026-10-03" },
      } as unknown as Awaited<ReturnType<typeof searchProducts>>;
    }

    it("en la página 1 con texto envía search con el total de resultados", async () => {
      vi.mocked(searchProducts).mockResolvedValue(resultsFor(7));
      render(await SearchResults({ searchParams: Promise.resolve({ q: "Aspirina" }) }));
      await waitFor(() =>
        expect(sendBeaconEvent).toHaveBeenCalledWith({
          type: "search",
          store_slug: null,
          product_slug: null,
          query: "Aspirina",
          category_slug: null,
          results_count: 7,
        }),
      );
    });

    it("sólo con categoría envía category_slug y query nulo", async () => {
      vi.mocked(searchProducts).mockResolvedValue(resultsFor(0));
      render(await SearchResults({ searchParams: Promise.resolve({ categoria: "salud" }) }));
      await waitFor(() =>
        expect(sendBeaconEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: "search", query: null, category_slug: "salud", results_count: 0 }),
        ),
      );
    });

    it("pasada la página 1 no envía nada", async () => {
      vi.mocked(searchProducts).mockResolvedValue(resultsFor(50));
      render(await SearchResults({ searchParams: Promise.resolve({ q: "aspirina", pagina: "2" }) }));
      expect(sendBeaconEvent).not.toHaveBeenCalled();
    });
  });

  describe("espacios publicitarios", () => {
    const offer = {
      store: { slug: "tienda-a", name: "Tienda A" },
      price_usd: "2.00",
      price_ves: "73.00",
      distance_km: null,
    };
    const product = (slug: string) => ({ slug, name: `Producto ${slug}`, image_url: null, category: null });
    const response = (extra: Record<string, unknown>) =>
      ({
        data: [],
        featured: [],
        meta: { page: 1, per_page: 20, total: 1 },
        rate: { rate: "100.00", date: "2026-10-03" },
        ...extra,
      }) as unknown as Awaited<ReturnType<typeof searchProducts>>;
    const sponsored = { product: product("patro"), offer, token: "tok-s", advertiser_name: "Anunciante" };

    it("monta search_top con la categoría del filtro", async () => {
      vi.mocked(searchProducts).mockResolvedValue(response({ data: [{ slug: "a" }] }));
      render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz", categoria: "salud" }) }));
      expect(screen.getByTestId("slot-search_top").getAttribute("data-category")).toBe("salud");
      expect(screen.queryByTestId("slot-search_empty")).toBeNull();
    });

    it("en el estado vacío monta search_empty", async () => {
      vi.mocked(searchProducts).mockResolvedValue(response({}));
      render(await SearchResults({ searchParams: Promise.resolve({ q: "zzz" }) }));
      expect(screen.getByTestId("slot-search_empty")).toBeTruthy();
    });

    it("pinta el patrocinado tras los destacados con Patrocinado, sin repetirlo en la lista", async () => {
      vi.mocked(searchProducts).mockResolvedValue(
        response({
          data: [
            { slug: "patro", name: "Producto patro" },
            { slug: "otro", name: "Producto otro", image_url: null, category: null, offers_count: 1, min_price_usd: "1.00", min_price_ves: "36.50", nearest_km: null, restriction: "none" },
          ],
          featured: [{ product: product("dest"), offer }],
          sponsored,
        }),
      );
      render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz" }) }));
      const items = screen.getByRole("list", { name: "Destacados" }).querySelectorAll("li");
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent).toContain("Destacado");
      expect(items[1]?.textContent).toContain("Patrocinado");
      expect(items[1]?.querySelector("a")?.getAttribute("href")).toBe("/p/patro");
      expect(screen.getByRole("list", { name: "Resultados" }).textContent).not.toContain("Producto patro");
    });

    it("sin sponsored, en la página 2 o ya destacado no pinta la tarjeta", async () => {
      vi.mocked(searchProducts).mockResolvedValue(response({ data: [{ slug: "a", name: "A", image_url: null, category: null, offers_count: 1, min_price_usd: "1.00", min_price_ves: "36.50", nearest_km: null, restriction: "none" }] }));
      render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz" }) }));
      expect(screen.queryByText("Patrocinado")).toBeNull();
      cleanup();
      vi.mocked(searchProducts).mockResolvedValue(response({ data: [{ slug: "a", name: "A", image_url: null, category: null, offers_count: 1, min_price_usd: "1.00", min_price_ves: "36.50", nearest_km: null, restriction: "none" }], sponsored }));
      render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz", pagina: "2" }) }));
      expect(screen.queryByText("Patrocinado")).toBeNull();
      cleanup();
      vi.mocked(searchProducts).mockResolvedValue(response({ featured: [{ product: product("patro"), offer }], sponsored }));
      render(await SearchResults({ searchParams: Promise.resolve({ q: "arroz" }) }));
      expect(screen.queryByText("Patrocinado")).toBeNull();
    });
  });
});
