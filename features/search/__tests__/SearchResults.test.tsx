import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { searchProducts } from "@/lib/marketplace/client";
import { sendBeaconEvent } from "@/features/events/lib/beacon";
import { SearchResults } from "@/features/search/components/SearchResults";

vi.mock("@/lib/marketplace/client", () => ({
  searchProducts: vi.fn(),
  listCategories: vi.fn(async () => []),
}));

vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));

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
});
