import { afterEach, describe, expect, it, vi } from "vitest";
import type { LocationState } from "@/lib/marketplace/schemas";
import { setLocationCity } from "./actions";

const cookieStore = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn() }));

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

afterEach(() => {
  cookieStore.set.mockReset();
  cookieStore.delete.mockReset();
});

describe("setLocationCity", () => {
  it("rechaza una ciudad desconocida sin tocar la cookie (RN-LOCATION-03)", async () => {
    await expect(setLocationCity("maracaibo")).resolves.toEqual({ ok: false });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("guarda una ciudad válida con las opciones de la cookie", async () => {
    await expect(setLocationCity("valencia")).resolves.toEqual({ ok: true });
    expect(cookieStore.set).toHaveBeenCalledWith("loc", '{"city":"valencia"}', {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 2592000,
      secure: false,
    });
  });
});
