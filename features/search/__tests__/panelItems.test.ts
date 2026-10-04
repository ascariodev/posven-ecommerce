import { describe, expect, it } from "vitest";
import { buildPanelItems, type SuggestionsData } from "@/features/search/lib/panelItems";
import type { SearchItem } from "@/lib/marketplace/schemas";

const PRODUCT: SearchItem = {
  slug: "acetaminofen-500",
  name: "Acetaminofén 500 mg",
  ean: null,
  brand: null,
  category: null,
  image_url: null,
  attributes: [],
  restriction: "none",
  is_unified: true,
  offers_count: 1,
  min_price_usd: "1.50",
  min_price_ves: "54.75",
  nearest_km: 1,
  outside_radius: false,
};

const DATA: SuggestionsData = {
  terms: ["Acetaminofén 500 mg"],
  products: [PRODUCT],
  categories: [{ slug: "analgesicos", name: "Analgésicos" }],
};

describe("buildPanelItems", () => {
  it("sin término sólo ofrece recientes", () => {
    const items = buildPanelItems({ query: " a ", data: DATA, recents: ["leche"], radio: 10 });
    expect(items.map((item) => item.kind)).toEqual(["recent"]);
  });

  it("con término ordena términos, productos, categorías y recientes con sus enlaces", () => {
    const items = buildPanelItems({ query: "acet", data: DATA, recents: ["leche"], radio: 25 });
    expect(items.map((item) => [item.kind, item.href])).toEqual([
      ["term", "/buscar?q=Acetaminof%C3%A9n+500+mg&radio=25"],
      ["product", "/p/acetaminofen-500"],
      ["category", "/buscar?q=acet&categoria=analgesicos&radio=25"],
      ["recent", "/buscar?q=leche&radio=25"],
    ]);
  });

  it("sin datos de la API deja los recientes", () => {
    expect(buildPanelItems({ query: "acet", data: null, recents: ["leche"], radio: 10 })).toHaveLength(1);
  });
});
