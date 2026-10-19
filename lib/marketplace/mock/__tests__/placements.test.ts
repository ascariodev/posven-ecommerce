import { afterEach, describe, expect, it, vi } from "vitest";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { getPlacements, MOCK_ADS_COOKIE } from "@/lib/marketplace/mock/adapter";
import { placementsResponseSchema } from "@/lib/marketplace/schemas";

const cookieValue = vi.hoisted(() => ({ current: undefined as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "mock_ads" && cookieValue.current !== undefined ? { name, value: cookieValue.current } : undefined),
  }),
}));

const query = { geo: null, radiusKm: null } as const;

afterEach(() => {
  cookieValue.current = undefined;
});

describe("espacios simulados", () => {
  it("la cookie se llama mock_ads", () => {
    expect(MOCK_ADS_COOKIE).toBe("mock_ads");
  });

  it("sin cookie responde una pieza por espacio y las secciones de la portada", async () => {
    const response = await getPlacements({ page: "home", ...query });
    expect(placementsResponseSchema.safeParse(response).success).toBe(true);
    expect(response.slots.home_hero).not.toBeNull();
    expect(response.sections?.length).toBeGreaterThan(0);
  });

  it("con mock_ads=none deja todos los espacios en null y sin sections", async () => {
    cookieValue.current = "none";
    const response = await getPlacements({ page: "home", ...query });
    expect(placementsResponseSchema.safeParse(response).success).toBe(true);
    expect(Object.keys(response.slots).length).toBeGreaterThan(0);
    expect(Object.values(response.slots).every((piece) => piece === null)).toBe(true);
    expect(response.sections).toBeUndefined();
  });

  it("con mock_ads=down lanza MarketplaceUnavailableError", async () => {
    cookieValue.current = "down";
    await expect(getPlacements({ page: "search", ...query })).rejects.toBeInstanceOf(MarketplaceUnavailableError);
  });

  it("un valor desconocido se ignora", async () => {
    cookieValue.current = "otro";
    const response = await getPlacements({ page: "home", ...query });
    expect(response.slots.home_hero).not.toBeNull();
  });
});
