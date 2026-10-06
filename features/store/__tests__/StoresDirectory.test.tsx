import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listNearbyStores } from "@/lib/marketplace/client";
import type { NearbyStore, StoresResponse } from "@/lib/marketplace/schemas";
import { StoresDirectory } from "../components/StoresDirectory";

vi.mock("@/lib/marketplace/client", () => ({
  listNearbyStores: vi.fn(),
}));

vi.mock("@/features/location/server/location", () => ({
  getEffectiveLocation: vi.fn(async () => ({ location: null, name: null })),
}));

function store(slug: string, name: string): NearbyStore {
  return {
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
    distance_km: null,
    outside_radius: false,
  };
}

function response(data: NearbyStore[], featured: NearbyStore[], page: number, total: number): StoresResponse {
  return { data, featured, meta: { page, per_page: 2, total } };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StoresDirectory", () => {
  it("lista los destacados primero sin repetirlos y pagina con /tiendas", async () => {
    const premium = store("farmacia-central", "Farmacia Central");
    vi.mocked(listNearbyStores).mockResolvedValue(
      response([store("abasto", "Abasto"), premium], [premium], 1, 6),
    );

    render(await StoresDirectory({ searchParams: Promise.resolve({}) }));

    const list = screen.getByRole("list", { name: "Comercios" });
    expect(Array.from(list.querySelectorAll("a")).map((link) => link.getAttribute("href"))).toEqual([
      "/tienda/farmacia-central",
      "/tienda/abasto",
    ]);
    expect(screen.getByText("Destacado")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")).toBe("/tiendas?pagina=2");
    expect(screen.queryByRole("link", { name: "Anterior" })).toBeNull();
  });

  it("pide la página de la URL y una inválida cae a la primera", async () => {
    vi.mocked(listNearbyStores).mockResolvedValue(response([store("a", "A")], [], 2, 3));

    render(await StoresDirectory({ searchParams: Promise.resolve({ pagina: "2" }) }));
    expect(vi.mocked(listNearbyStores).mock.calls[0][0].page).toBe(2);
    expect(screen.getByRole("link", { name: "Anterior" }).getAttribute("href")).toBe("/tiendas");

    cleanup();
    await StoresDirectory({ searchParams: Promise.resolve({ pagina: "abc" }) });
    expect(vi.mocked(listNearbyStores).mock.calls[1][0].page).toBe(1);
  });

  it("sin comercios avisa y no pinta la lista", async () => {
    vi.mocked(listNearbyStores).mockResolvedValue(response([], [], 1, 0));

    render(await StoresDirectory({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText(/Todavía no hay comercios/)).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("una página fuera de rango avisa y pide noindex; la primera vacía no", async () => {
    vi.mocked(listNearbyStores).mockResolvedValue(response([], [], 9, 3));

    render(await StoresDirectory({ searchParams: Promise.resolve({ pagina: "9" }) }));
    expect(screen.getByText("No hay más comercios.")).toBeTruthy();
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");

    cleanup();
    vi.mocked(listNearbyStores).mockResolvedValue(response([], [], 1, 0));
    render(await StoresDirectory({ searchParams: Promise.resolve({}) }));
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });
});
