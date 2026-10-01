import { afterEach, describe, expect, it, vi } from "vitest";
import type { LocationState } from "@/lib/marketplace/schemas";
import { getEffectiveLocation } from "@/features/location/server/location";

const cookieStore = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

vi.mock("@/lib/marketplace/client", () => {
  const states: LocationState[] = [
    {
      slug: "carabobo",
      name: "Carabobo",
      municipalities: [{ slug: "valencia", name: "Valencia", cities: [{ slug: "valencia", name: "Valencia" }] }],
    },
  ];
  return { listLocations: async () => states };
});

function withCookie(value: string): void {
  cookieStore.get.mockReturnValue({ name: "loc", value });
}

afterEach(() => {
  cookieStore.get.mockReset();
});

describe("getEffectiveLocation", () => {
  it("una ciudad desconocida cuenta como sin ubicación (RN-LOCATION-04)", async () => {
    withCookie('{"city":"atlantida"}');
    await expect(getEffectiveLocation()).resolves.toEqual({ location: null, name: null });
  });

  it("una ciudad conocida trae su nombre", async () => {
    withCookie('{"city":"valencia"}');
    await expect(getEffectiveLocation()).resolves.toEqual({
      location: { kind: "city", city: "valencia" },
      name: "Valencia",
    });
  });

  it("con coordenadas trae la ubicación y el nombre de describeLocation", async () => {
    withCookie('{"lat":10.162,"lng":-68.007}');
    await expect(getEffectiveLocation()).resolves.toEqual({
      location: { kind: "coords", lat: 10.162, lng: -68.007 },
      name: "Tu ubicación actual",
    });
  });
});
