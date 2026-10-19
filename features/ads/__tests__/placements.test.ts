import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlacements } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { Piece, PlacementsResponse } from "@/lib/marketplace/schemas";
import { getPagePlacements, pieceForSlot } from "../server/placements";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <A extends unknown[], R>(fn: (...args: A) => R) => {
      const memo = new Map<string, R>();
      return (...args: A): R => {
        const key = JSON.stringify(args);
        if (!memo.has(key)) memo.set(key, fn(...args));
        return memo.get(key) as R;
      };
    },
  };
});

vi.mock("@/lib/marketplace/client", () => ({ getPlacements: vi.fn() }));
vi.mock("@/features/location/server/location", () => ({
  getEffectiveLocation: vi.fn(async () => ({ location: { kind: "city", city: "caracas" }, name: "Caracas" })),
}));

const piece: Piece = {
  kind: "ad",
  format: "banner",
  image_desktop_url: "data:image/png;base64,AA",
  image_mobile_url: null,
  alt: "Oferta",
  badge: null,
  title: null,
  cta: null,
  href: "/tiendas",
  external: false,
  advertiser_name: null,
  token: "tok",
};
const response: PlacementsResponse = { slots: { home_strip: piece, home_bottom: null } };

afterEach(() => vi.clearAllMocks());

describe("getPagePlacements", () => {
  it("pide la página con la ubicación efectiva y la categoría o tienda", async () => {
    vi.mocked(getPlacements).mockResolvedValue(response);
    await expect(getPagePlacements("product", { category: "salud" })).resolves.toBe(response);
    expect(getPlacements).toHaveBeenCalledWith({
      page: "product",
      geo: { city: "caracas" },
      radiusKm: 10,
      category: "salud",
      store: null,
    });
  });

  it("llamadas con los mismos argumentos, con o sin el objeto de alcance, comparten una sola lectura", async () => {
    vi.mocked(getPlacements).mockResolvedValue(response);
    await getPagePlacements("stores");
    await getPagePlacements("stores", {});
    await getPagePlacements("stores", { category: undefined, store: null });
    expect(getPlacements).toHaveBeenCalledTimes(1);
    await getPagePlacements("store", { store: "abasto" });
    expect(getPlacements).toHaveBeenCalledTimes(2);
  });

  it("devuelve null si la API no está y relanza cualquier otro error", async () => {
    vi.mocked(getPlacements).mockRejectedValueOnce(new MarketplaceUnavailableError("/placements"));
    await expect(getPagePlacements("search")).resolves.toBeNull();
    vi.mocked(getPlacements).mockRejectedValueOnce(new Error("otro"));
    await expect(getPagePlacements("home")).rejects.toThrow("otro");
  });
});

describe("pieceForSlot", () => {
  it("devuelve la pieza del espacio o null si no hay", () => {
    expect(pieceForSlot(response, "home_strip")).toBe(piece);
    expect(pieceForSlot(response, "home_bottom")).toBeNull();
    expect(pieceForSlot(response, "otro")).toBeNull();
    expect(pieceForSlot(null, "home_strip")).toBeNull();
  });
});
