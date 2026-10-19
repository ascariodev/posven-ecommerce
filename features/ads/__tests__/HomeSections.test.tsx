import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HOME_SECTION_KEYS, type Piece, type PlacementsResponse } from "@/lib/marketplace/schemas";
import { getPagePlacements } from "../server/placements";
import { type HomeBlocks, HomeSectionList, HomeSections, homeSectionOrder } from "../components/HomeSections";

vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));
vi.mock("../server/placements", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../server/placements")>()),
  getPagePlacements: vi.fn(),
}));

const IMG = "data:image/png;base64,AA";

const blocks: HomeBlocks = {
  trust_strip: <p>trust_strip</p>,
  categories: <p>categories</p>,
  nearby_products: <p>nearby_products</p>,
  how_it_works: <p>how_it_works</p>,
  nearby_stores: <p>nearby_stores</p>,
};
const promoFallbacks = [<p key="1">promos</p>, null];

function banner(alt: string, overrides: Partial<Piece> = {}): Piece {
  return {
    kind: "ad",
    format: "banner",
    image_desktop_url: IMG,
    image_mobile_url: IMG,
    alt,
    badge: null,
    title: null,
    cta: null,
    href: "/tiendas",
    external: false,
    advertiser_name: null,
    token: `tok-${alt}`,
    ...overrides,
  };
}

const withBanners = (sections?: string[]): PlacementsResponse => ({
  slots: { home_strip: banner("home_strip"), home_bottom: banner("home_bottom") },
  ...(sections === undefined ? {} : { sections }),
});

function renderedOrder(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("p, img"))
    .filter((node) => node.tagName === "P" || node.className.includes("sm:hidden"))
    .map((node) => node.textContent || node.getAttribute("alt") || "");
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("homeSectionOrder", () => {
  it("sin respuesta o sin sections da el orden por defecto", () => {
    expect(homeSectionOrder(null)).toEqual([...HOME_SECTION_KEYS]);
    expect(homeSectionOrder({ slots: {} })).toEqual([...HOME_SECTION_KEYS]);
  });

  it("sigue sections, ignora claves desconocidas y repetidas, y oculta las ausentes", () => {
    expect(homeSectionOrder({ slots: {}, sections: ["nearby_stores", "hero", "promos", "nearby_stores", "trust_strip"] })).toEqual([
      "nearby_stores",
      "promos",
      "trust_strip",
    ]);
    expect(homeSectionOrder({ slots: {}, sections: [] })).toEqual([]);
  });
});

describe("HomeSectionList", () => {
  it("sin respuesta pinta lo de hoy en el orden por defecto y sin banners", () => {
    const { container } = render(<HomeSectionList placements={null} blocks={blocks} promoFallbacks={promoFallbacks} />);
    expect(renderedOrder(container)).toEqual([
      "trust_strip",
      "promos",
      "categories",
      "nearby_products",
      "how_it_works",
      "nearby_stores",
    ]);
  });

  it("sin sections pinta los banners en su lugar por defecto", () => {
    const { container } = render(<HomeSectionList placements={withBanners()} blocks={blocks} promoFallbacks={promoFallbacks} />);
    expect(renderedOrder(container)).toEqual([
      "trust_strip",
      "promos",
      "categories",
      "home_strip",
      "nearby_products",
      "how_it_works",
      "nearby_stores",
      "home_bottom",
    ]);
  });

  it("con sections reordena, ignora las desconocidas y oculta las ausentes", () => {
    const placements = withBanners(["home_bottom", "nearby_products", "desconocida", "categories", "promos"]);
    const { container } = render(<HomeSectionList placements={placements} blocks={blocks} promoFallbacks={promoFallbacks} />);
    expect(renderedOrder(container)).toEqual(["home_bottom", "nearby_products", "categories", "promos"]);
  });

  it("un banner sin pieza, de otro formato o sin imagen no se pinta", () => {
    const placements: PlacementsResponse = {
      slots: {
        home_strip: banner("home_strip", { format: "promo" }),
        home_bottom: banner("home_bottom", { image_desktop_url: null, image_mobile_url: null }),
      },
    };
    const { container } = render(<HomeSectionList placements={placements} blocks={blocks} promoFallbacks={promoFallbacks} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("HomeSections", () => {
  it("arranca preload antes de que resuelva /placements", async () => {
    let resolvePlacements: (value: PlacementsResponse | null) => void = () => {};
    vi.mocked(getPagePlacements).mockReturnValue(new Promise((resolve) => (resolvePlacements = resolve)));
    const preload = vi.fn();
    const pending = HomeSections({ blocks, promoFallbacks, preload });
    expect(preload).toHaveBeenCalledTimes(1);
    expect(getPagePlacements).toHaveBeenCalledWith("home");
    resolvePlacements(null);
    render(await pending);
    expect(preload).toHaveBeenCalledTimes(1);
  });

  it("lee los espacios de la portada una vez y, con la API caída, usa el orden por defecto", async () => {
    vi.mocked(getPagePlacements).mockResolvedValue(null);
    const { container } = render(await HomeSections({ blocks, promoFallbacks }));
    expect(getPagePlacements).toHaveBeenCalledTimes(1);
    expect(getPagePlacements).toHaveBeenCalledWith("home");
    expect(renderedOrder(container)).toEqual([
      "trust_strip",
      "promos",
      "categories",
      "nearby_products",
      "how_it_works",
      "nearby_stores",
    ]);
  });

  it("con respuesta sigue sus sections", async () => {
    vi.mocked(getPagePlacements).mockResolvedValue(withBanners(["home_strip", "trust_strip"]));
    const { container } = render(await HomeSections({ blocks, promoFallbacks }));
    expect(renderedOrder(container)).toEqual(["home_strip", "trust_strip"]);
  });
});
