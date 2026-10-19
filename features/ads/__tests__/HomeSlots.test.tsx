import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendBeaconEvent } from "@/features/events/lib/beacon";
import type { Piece, PlacementsResponse } from "@/lib/marketplace/schemas";
import { getPagePlacements } from "../server/placements";
import { HomeHeroSlot } from "../components/HeroPiece";
import { HomePromos } from "../components/PromoPiece";

vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));
vi.mock("../server/placements", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../server/placements")>()),
  getPagePlacements: vi.fn(),
}));

const IMG = "data:image/png;base64,AA";
const FALLBACK = <span>lo de hoy</span>;

function piece(overrides: Partial<Piece> = {}): Piece {
  return {
    kind: "ad",
    format: "hero",
    image_desktop_url: IMG,
    image_mobile_url: IMG,
    alt: "Anuncio del hero",
    badge: "Nuevo",
    title: null,
    cta: "Ver más",
    href: "/tiendas",
    external: false,
    advertiser_name: "Farmacia",
    token: "tok-hero",
    ...overrides,
  };
}

function withSlots(slots: PlacementsResponse["slots"] | null) {
  vi.mocked(getPagePlacements).mockResolvedValue(slots === null ? null : { slots });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("HomeHeroSlot", () => {
  it("sin pieza, con la API caída o con otro formato pinta lo de hoy", async () => {
    const cases: Array<PlacementsResponse["slots"] | null> = [null, {}, { home_hero: null }, { home_hero: piece({ format: "banner" }) }];
    for (const slots of cases) {
      withSlots(slots);
      render(await HomeHeroSlot({ fallback: FALLBACK }));
      expect(screen.getByText("lo de hoy")).toBeTruthy();
      expect(screen.queryByRole("link")).toBeNull();
      cleanup();
    }
    withSlots({ home_hero: piece({ image_desktop_url: null, image_mobile_url: null }) });
    render(await HomeHeroSlot({ fallback: FALLBACK }));
    expect(screen.getByText("lo de hoy")).toBeTruthy();
    expect(getPagePlacements).toHaveBeenCalledWith("home");
  });

  it("con pieza pinta sus dos imágenes, badge, cta y la marca sólo en kind ad, y cuenta el clic", async () => {
    withSlots({ home_hero: piece() });
    render(await HomeHeroSlot({ fallback: FALLBACK }));
    expect(screen.queryByText("lo de hoy")).toBeNull();
    expect(screen.getAllByAltText("Anuncio del hero")).toHaveLength(2);
    expect(screen.getByText("Nuevo")).toBeTruthy();
    expect(screen.getByText("Ver más")).toBeTruthy();
    expect(screen.getByText("Patrocinado")).toBeTruthy();
    fireEvent.click(screen.getByRole("link"));
    expect(sendBeaconEvent).toHaveBeenCalledWith({ type: "ad_click", ad_token: "tok-hero" });
    cleanup();

    withSlots({ home_hero: piece({ kind: "house" }) });
    render(await HomeHeroSlot({ fallback: FALLBACK }));
    expect(screen.queryByText("Patrocinado")).toBeNull();
  });

  it("sin alt, el enlace lleva un nombre sr-only en todos los anchos aunque traiga badge y cta", async () => {
    withSlots({ home_hero: piece({ kind: "house", alt: null }) });
    render(await HomeHeroSlot({ fallback: FALLBACK }));
    const label = screen.getByText("Farmacia");
    expect(label.className).toBe("sr-only");
    expect(screen.getByRole("link").contains(label)).toBe(true);
  });
});

describe("HomePromos", () => {
  const promoSlots = async ({ fallbacks }: { fallbacks: ReactNode[] }) =>
    HomePromos({ placements: await getPagePlacements("home"), fallbacks });
  const promo = (overrides: Partial<Piece> = {}) =>
    piece({ format: "promo", badge: "Oferta", title: "Vitaminas", cta: "Ver oferta", token: "tok-promo", ...overrides });
  const fallbacks = [<span key="1">tarjeta 1</span>, <span key="2">tarjeta 2</span>];

  it("sin pieza, con la API caída o con otro formato pinta las tarjetas de hoy", async () => {
    const cases: Array<PlacementsResponse["slots"] | null> = [null, {}, { home_promo_1: promo({ format: "hero" }), home_promo_2: null }];
    for (const slots of cases) {
      withSlots(slots);
      render(await promoSlots({ fallbacks }));
      expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["tarjeta 1", "tarjeta 2"]);
      cleanup();
    }
    withSlots(null);
    const { container } = render(await promoSlots({ fallbacks: [null, null] }));
    expect(container.innerHTML).toBe("");
  });

  it("cada espacio reemplaza su tarjeta con badge, título, cta y la marca sólo en kind ad", async () => {
    withSlots({ home_promo_2: promo() });
    render(await promoSlots({ fallbacks }));
    const items = screen.getAllByRole("listitem");
    expect(items[0]?.textContent).toBe("tarjeta 1");
    expect(items[1]?.textContent).toContain("Vitaminas");
    expect(screen.getByText("Oferta")).toBeTruthy();
    expect(screen.getByText("Ver oferta")).toBeTruthy();
    expect(screen.getByText("Patrocinado")).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/tiendas");
    cleanup();

    withSlots({ home_promo_1: promo({ kind: "house" }) });
    render(await promoSlots({ fallbacks }));
    expect(screen.queryByText("Patrocinado")).toBeNull();
  });

  it("pinta la pieza aunque su espacio no tenga tarjeta de respaldo", async () => {
    withSlots({ home_promo_2: promo() });
    render(await promoSlots({ fallbacks: [null, null] }));
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toContain("Vitaminas");
  });
});
