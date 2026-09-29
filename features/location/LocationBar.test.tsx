import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { LocationSummary } from "./LocationBar";
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
});

describe("LocationSummary", () => {
  it("con ciudad efectiva pinta Cerca de y su nombre", async () => {
    vi.mocked(getEffectiveLocation).mockResolvedValue({
      location: { kind: "city", city: "valencia" },
      name: "Valencia",
    });

    render(await LocationSummary());

    expect(screen.getByText("Cerca de: Valencia")).toBeTruthy();
  });

  it("con la API caída pinta Sin ubicación en vez de romper la cabecera", async () => {
    vi.mocked(getEffectiveLocation).mockRejectedValue(new MarketplaceUnavailableError("/locations"));

    render(await LocationSummary());

    expect(screen.getByText("Sin ubicación")).toBeTruthy();
  });
});
