import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listNearbyStores } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { NearbyStore, SponsoredStore, StoresResponse } from "@/lib/marketplace/schemas";
import { NearbyStores, preloadNearbyStores } from "../components/NearbyStores";

vi.mock("@/lib/marketplace/client", () => ({
  listNearbyStores: vi.fn(),
}));

vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));

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

function sponsoredOf(base: NearbyStore): SponsoredStore {
  return { ...base, token: "tok-1", advertiser_name: "Anunciante" };
}

function response(data: NearbyStore[], featured: NearbyStore[], sponsored?: SponsoredStore): StoresResponse {
  return { data, featured, ...(sponsored ? { sponsored } : {}), meta: { page: 1, per_page: 12, total: data.length } };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NearbyStores", () => {
  it("pide el espacio home_stores_native y pinta sponsored arriba sin repetirlo en la lista", async () => {
    const ad = store("farmacia-central", "Farmacia Central");
    const other = store("abasto-la-esquina", "Abasto La Esquina");
    vi.mocked(listNearbyStores).mockResolvedValue(response([other, ad], [], sponsoredOf(ad)));

    render(await NearbyStores());

    expect(vi.mocked(listNearbyStores).mock.calls[0][0].placement).toBe("home_stores_native");
    expect(screen.getByText("Patrocinado")).toBeTruthy();
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/tienda/farmacia-central",
      "/tiendas",
      "/tienda/abasto-la-esquina",
    ]);
    expect(within(links[0]).getByText("Ver tienda")).toBeTruthy();
  });

  it("todos los destacados van a la lista como Destacado y sin sponsored no hay bloque patrocinado", async () => {
    const first = store("a", "Tienda A", { is_premium: true });
    const second = store("b", "Tienda B");
    const other = store("c", "Tienda C");
    vi.mocked(listNearbyStores).mockResolvedValue(response([other, second], [first, second]));

    render(await NearbyStores());

    expect(screen.queryByText("Patrocinado")).toBeNull();
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/tiendas", "/tienda/a", "/tienda/b", "/tienda/c"]);
    expect(within(links[1]).getByText("Destacado")).toBeTruthy();
    expect(within(links[1]).getByText("Aliado PosVen")).toBeTruthy();
    expect(within(links[2]).getByText("Destacado")).toBeTruthy();
  });

  it("sin sponsored ni destacados no pinta el bloque patrocinado", async () => {
    vi.mocked(listNearbyStores).mockResolvedValue(response([store("c", "Tienda C")], []));

    render(await NearbyStores());

    expect(screen.queryByText("Patrocinado")).toBeNull();
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

  it("preloadNearbyStores lee con los mismos argumentos que el componente y no propaga el rechazo", async () => {
    vi.mocked(listNearbyStores).mockResolvedValue({ data: [], featured: [], meta: { page: 1, per_page: 12, total: 0 } } as unknown as StoresResponse);
    render(await NearbyStores());
    const componentArgs = vi.mocked(listNearbyStores).mock.calls.at(-1)?.[0];
    vi.mocked(listNearbyStores).mockClear();
    vi.mocked(listNearbyStores).mockRejectedValue(new Error("caída"));

    preloadNearbyStores();
    await vi.waitFor(() => expect(listNearbyStores).toHaveBeenCalledTimes(1));

    expect(vi.mocked(listNearbyStores).mock.calls[0]?.[0]).toStrictEqual(componentArgs);
  });
});
