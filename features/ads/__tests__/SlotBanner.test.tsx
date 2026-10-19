import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPagePlacements } from "@/features/ads/server/placements";
import type { Piece, PlacementsResponse } from "@/lib/marketplace/schemas";
import { SlotBanner } from "../components/SlotBanner";

vi.mock("@/features/ads/server/placements", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/ads/server/placements")>()),
  getPagePlacements: vi.fn(),
}));
vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));

function piece(overrides: Partial<Piece> = {}): Piece {
  return {
    kind: "ad",
    format: "banner",
    image_desktop_url: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
    image_mobile_url: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
    alt: "Oferta",
    badge: null,
    title: null,
    cta: null,
    href: "/tiendas",
    external: false,
    advertiser_name: "Anunciante",
    token: "tok",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SlotBanner", () => {
  it("pinta la pieza de banner del espacio pedido", async () => {
    const placements: PlacementsResponse = { slots: { stores_top: piece() } };
    vi.mocked(getPagePlacements).mockResolvedValue(placements);
    const { container } = render(await SlotBanner({ page: "stores", slot: "stores_top" }));
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/tiendas");
  });

  it("sin pieza, con otro formato o con la API caída no pinta nada", async () => {
    vi.mocked(getPagePlacements).mockResolvedValue({ slots: { stores_top: piece({ format: "hero" }) } });
    expect(render(await SlotBanner({ page: "stores", slot: "stores_top" })).container.innerHTML).toBe("");
    cleanup();
    vi.mocked(getPagePlacements).mockResolvedValue({ slots: {} });
    expect(render(await SlotBanner({ page: "stores", slot: "stores_top" })).container.innerHTML).toBe("");
    cleanup();
    vi.mocked(getPagePlacements).mockResolvedValue(null);
    expect(render(await SlotBanner({ page: "stores", slot: "stores_top" })).container.innerHTML).toBe("");
  });
});
