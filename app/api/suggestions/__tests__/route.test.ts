import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";

const { getSuggestions, getUserLocation } = vi.hoisted(() => ({
  getSuggestions: vi.fn(),
  getUserLocation: vi.fn(),
}));

vi.mock("@/lib/marketplace/client", () => ({ getSuggestions }));
vi.mock("@/features/location/server/location", () => ({ getUserLocation }));

import { GET } from "@/app/api/suggestions/route";

const RESPONSE = { terms: ["Arroz"], products: [], categories: [], rate: { usd_ves: "36.50", valid_on: "2026-09-26" } };

function get(search: string): Promise<Response> {
  return GET(new Request(`http://localhost/api/suggestions${search}`));
}

describe("GET /api/suggestions", () => {
  beforeEach(() => {
    getSuggestions.mockReset();
    getSuggestions.mockResolvedValue(RESPONSE);
    getUserLocation.mockReset();
    getUserLocation.mockResolvedValue(null);
  });

  it.each(["", "?q=", "?q=a", "?q=%20a%20"])("con q corto (%s) responde vacío sin llamar a la API", async (search) => {
    const response = await get(search);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ terms: [], products: [], categories: [], rate: null });
    expect(getSuggestions).not.toHaveBeenCalled();
  });

  it("pasa q, la ubicación de la cookie y el radio", async () => {
    getUserLocation.mockResolvedValue({ kind: "coords", lat: 10.18, lng: -68.01 });
    const response = await get("?q=%20arroz%20&radio=25");
    expect(await response.json()).toEqual(RESPONSE);
    expect(getSuggestions).toHaveBeenCalledWith({ q: "arroz", geo: { lat: 10.18, lng: -68.01 }, radiusKm: 25 });
  });

  it("radio=pais pide todo el país y un radio inválido usa el de por defecto", async () => {
    await get("?q=arroz&radio=pais");
    await get("?q=arroz&radio=7");
    expect(getSuggestions.mock.calls[0]?.[0]).toMatchObject({ radiusKm: null });
    expect(getSuggestions.mock.calls[1]?.[0]).toMatchObject({ radiusKm: 10 });
  });

  it("si la API no responde, 503 con listas vacías", async () => {
    getSuggestions.mockRejectedValue(new MarketplaceUnavailableError("caída"));
    const response = await get("?q=arroz");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ terms: [], products: [], categories: [], rate: null });
  });

  it("un error distinto de MarketplaceUnavailableError se relanza y no responde 503", async () => {
    const failure = new Error("bug");
    getSuggestions.mockRejectedValue(failure);
    await expect(get("?q=arroz")).rejects.toBe(failure);
  });
});
