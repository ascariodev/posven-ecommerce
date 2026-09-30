import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { listLocations } from "@/lib/marketplace/client";
import { LocationBar } from "./LocationBar";
import { getEffectiveLocation } from "./server";

vi.mock("@/lib/marketplace/client", () => ({
  listLocations: vi.fn(),
}));

vi.mock("./LocationPicker", () => ({
  LocationPicker: () => null,
}));

vi.mock("./server", () => ({
  getEffectiveLocation: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function unavailable() {
  vi.mocked(getEffectiveLocation).mockRejectedValue(new MarketplaceUnavailableError("/locations"));
  vi.mocked(listLocations).mockRejectedValue(new MarketplaceUnavailableError("/locations"));
}

describe("LocationBar", () => {
  it("con degrade y ciudad efectiva pinta el segmento con su nombre accesible", async () => {
    vi.mocked(getEffectiveLocation).mockResolvedValue({
      location: { kind: "city", city: "valencia" },
      name: "Valencia",
    });
    vi.mocked(listLocations).mockResolvedValue([]);
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));

    render(await LocationBar({ compact: true, degrade: true }));

    expect(screen.getByRole("button", { name: "Ubicación: Valencia" })).toBeTruthy();
  });

  it("con degrade y la API caída no pinta nada en vez de romper la cabecera", async () => {
    unavailable();

    const { container } = render(await LocationBar({ compact: true, degrade: true }));

    expect(container.innerHTML).toBe("");
  });

  it("sin degrade y la API caída propaga el error hacia app/error.tsx", async () => {
    unavailable();

    await expect(LocationBar({ compact: true })).rejects.toBeInstanceOf(MarketplaceUnavailableError);
  });
});
