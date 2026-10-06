import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listNearbyProducts } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { NearbyProductsResponse, SearchItem } from "@/lib/marketplace/schemas";
import { NearbyProducts } from "../components/NearbyProducts";

vi.mock("@/lib/marketplace/client", () => ({
  listNearbyProducts: vi.fn(),
}));

vi.mock("@/features/location/server/location", () => ({
  getEffectiveLocation: vi.fn(async () => ({ location: null, name: null })),
}));

function item(slug: string, overrides: Partial<SearchItem> = {}): SearchItem {
  return {
    slug,
    name: `Producto ${slug}`,
    ean: null,
    brand: null,
    category: null,
    image_url: null,
    attributes: [],
    restriction: "none",
    is_unified: true,
    offers_count: 3,
    min_price_usd: "1.35",
    min_price_ves: "49.28",
    nearest_km: 0.8,
    outside_radius: false,
    ...overrides,
  };
}

function response(data: SearchItem[]): NearbyProductsResponse {
  return {
    data,
    meta: { page: 1, per_page: 12, total: data.length },
    rate: { usd_ves: "36.5000", valid_on: "2026-10-04" },
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NearbyProducts", () => {
  it("pinta una tarjeta por producto con precio, tiendas, distancia y enlace a la ficha", async () => {
    vi.mocked(listNearbyProducts).mockResolvedValue(response([item("a"), item("b", { offers_count: 1 })]));

    render(await NearbyProducts());

    const links = screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("/p/"));
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/p/a", "/p/b"]);
    expect(links[0].getAttribute("aria-label")).toBeNull();
    expect(screen.getByRole("link", { name: (name) => name.startsWith("Producto a") && name.includes("3 tiendas") })).toBe(links[0]);
    expect(screen.getByText("3 tiendas · a 800 m")).toBeTruthy();
    expect(screen.getByText("1 tienda · a 800 m")).toBeTruthy();
    expect(screen.getAllByText("desde")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Ver todo" }).getAttribute("href")).toMatch(/^\/buscar/);
  });

  it("sin productos no pinta nada", async () => {
    vi.mocked(listNearbyProducts).mockResolvedValue(response([]));

    const { container } = render(await NearbyProducts());

    expect(container.innerHTML).toBe("");
  });

  it("si la API no responde no pinta nada", async () => {
    vi.mocked(listNearbyProducts).mockRejectedValue(new MarketplaceUnavailableError("/products/nearby"));

    const { container } = render(await NearbyProducts());

    expect(container.innerHTML).toBe("");
  });

  it("con título y sin Ver todo usa el título dado y no enlaza a /buscar", async () => {
    vi.mocked(listNearbyProducts).mockResolvedValue(response([item("a")]));

    render(await NearbyProducts({ title: "Quizás te sirve", showAll: false }));

    expect(screen.getByRole("heading", { name: "Quizás te sirve" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Ver todo" })).toBeNull();
  });

  it("con openNow lo pasa a listNearbyProducts y sin él lo omite", async () => {
    vi.mocked(listNearbyProducts).mockResolvedValue(response([item("a")]));

    render(await NearbyProducts({ openNow: true }));
    expect(vi.mocked(listNearbyProducts).mock.calls.at(-1)?.[0]).toMatchObject({ openNow: true });
    cleanup();
    render(await NearbyProducts());
    expect(vi.mocked(listNearbyProducts).mock.calls.at(-1)?.[0].openNow).toBeUndefined();
  });

  it("enlaza la sección a su encabezado con el headingId dado", async () => {
    vi.mocked(listNearbyProducts).mockResolvedValue(response([item("a")]));

    render(await NearbyProducts({ title: "Quizás te sirve", headingId: "otro-id" }));

    expect(screen.getByRole("region", { name: "Quizás te sirve" }).getAttribute("aria-labelledby")).toBe("otro-id");
    expect(screen.getByRole("heading", { name: "Quizás te sirve" }).id).toBe("otro-id");
  });
});
