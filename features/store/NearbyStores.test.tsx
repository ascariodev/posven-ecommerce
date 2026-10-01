import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listNearbyStores } from "@/lib/marketplace/client";
import type { NearbyStore, StoresResponse } from "@/lib/marketplace/schemas";
import { NearbyStores } from "./NearbyStores";

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
  it("un destacado que también viene en data aparece una sola vez y primero", async () => {
    const premium = store("farmacia-central", "Farmacia Central", { is_premium: true });
    const other = store("abasto-la-esquina", "Abasto La Esquina");
    vi.mocked(listNearbyStores).mockResolvedValue(response([other, premium], [premium]));

    render(await NearbyStores());

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/tienda/farmacia-central",
      "/tienda/abasto-la-esquina",
    ]);
    expect(within(links[0]).getByText("Destacado")).toBeTruthy();
    expect(within(links[1]).queryByText("Destacado")).toBeNull();
  });
});
