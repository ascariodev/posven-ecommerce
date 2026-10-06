import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listNearbyStores } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { NearbyStore, StoresResponse } from "@/lib/marketplace/schemas";
import { NearbyStores } from "../components/NearbyStores";

vi.mock("@/lib/marketplace/client", () => ({
  listNearbyStores: vi.fn(),
}));

vi.mock("@/features/location/server/location", () => ({
  getEffectiveLocation: vi.fn(async () => ({ location: null, name: null })),
}));

function store(slug: string, name: string, overrides: Partial<NearbyStore> = {}): NearbyStore {
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
    ...overrides,
  };
}

function response(data: NearbyStore[], featured: NearbyStore[]): StoresResponse {
  return { data, featured, meta: { page: 1, per_page: 12, total: data.length } };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NearbyStores", () => {
  it("el primer destacado va en el bloque patrocinado y no se repite en la lista", async () => {
    const premium = store("farmacia-central", "Farmacia Central", { is_premium: true });
    const other = store("abasto-la-esquina", "Abasto La Esquina");
    vi.mocked(listNearbyStores).mockResolvedValue(response([other, premium], [premium]));

    render(await NearbyStores());

    expect(screen.getByText("PATROCINADO")).toBeTruthy();
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/tienda/farmacia-central",
      "/tiendas",
      "/tienda/abasto-la-esquina",
    ]);
    expect(within(links[0]).getByText("Ver tienda")).toBeTruthy();
    expect(within(links[2]).queryByText("Destacado")).toBeNull();
  });

  it("el segundo destacado abre la lista con la etiqueta Destacado", async () => {
    const first = store("a", "Tienda A");
    const second = store("b", "Tienda B");
    const other = store("c", "Tienda C");
    vi.mocked(listNearbyStores).mockResolvedValue(response([other, second], [first, second]));

    render(await NearbyStores());

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["/tienda/a", "/tiendas", "/tienda/b", "/tienda/c"]);
    expect(within(screen.getAllByRole("link")[2]).getByText("Destacado")).toBeTruthy();
  });

  it("el segundo destacado premium lleva el sello Aliado PosVen junto a Destacado", async () => {
    const first = store("a", "Tienda A", { is_premium: true });
    const second = store("b", "Tienda B", { is_premium: true });
    const other = store("c", "Tienda C");
    vi.mocked(listNearbyStores).mockResolvedValue(response([other, second], [first, second]));

    render(await NearbyStores());

    const links = screen.getAllByRole("link");
    expect(within(links[2]).getByText("Destacado")).toBeTruthy();
    expect(within(links[2]).getByText("Aliado PosVen")).toBeTruthy();
    expect(within(links[3]).queryByText("Aliado PosVen")).toBeNull();
  });

  it("sin destacados no pinta el bloque patrocinado", async () => {
    vi.mocked(listNearbyStores).mockResolvedValue(response([store("c", "Tienda C")], []));

    render(await NearbyStores());

    expect(screen.queryByText("PATROCINADO")).toBeNull();
    expect(screen.getByRole("heading", { name: /^Comercios en / })).toBeTruthy();
  });

  it("avisa que las tiendas están fuera de rango sólo con out_of_range true", async () => {
    const data = [store("abasto-la-esquina", "Abasto La Esquina")];
    vi.mocked(listNearbyStores).mockResolvedValue({ ...response(data, []), meta: { page: 1, per_page: 12, total: 1, out_of_range: true } });
    render(await NearbyStores());
    expect(screen.getByRole("status").textContent).toContain("fuera");
    cleanup();

    vi.mocked(listNearbyStores).mockResolvedValue(response(data, []));
    render(await NearbyStores());
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("si la API no responde no pinta nada", async () => {
    vi.mocked(listNearbyStores).mockRejectedValue(new MarketplaceUnavailableError("/stores"));

    const { container } = render(await NearbyStores());

    expect(container.innerHTML).toBe("");
  });

  it("un error que no es de indisponibilidad se relanza", async () => {
    vi.mocked(listNearbyStores).mockRejectedValue(new Error("otro"));

    await expect(NearbyStores()).rejects.toThrow("otro");
  });
});
