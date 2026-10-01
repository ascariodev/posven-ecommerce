import { describe, expect, it } from "vitest";
import type { ProductDetail } from "@/lib/marketplace/schemas";
import { productJsonLd } from "@/features/product/lib/jsonld";

function product(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    slug: "acetaminofen-500-mg-20-tabletas",
    name: "Acetaminofén 500 mg x 20 tabletas",
    ean: "7590000000011",
    brand: "Genven",
    category: { slug: "analgesicos", name: "Analgésicos", parent_slug: "farmacia" },
    image_url: null,
    attributes: [],
    restriction: "none",
    is_unified: true,
    offers_summary: { offer_count: 4, low_price_usd: "2.35", high_price_usd: "2.80" },
    ...overrides,
  };
}

describe("productJsonLd", () => {
  it("con ofertas trae un AggregateOffer con los valores de offers_summary", () => {
    expect(productJsonLd(product())).toMatchObject({
      "@type": "Product",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "2.35",
        highPrice: "2.80",
        offerCount: 4,
        priceCurrency: "USD",
      },
    });
  });

  it("sin ofertas no trae offers", () => {
    const jsonLd = productJsonLd(
      product({ offers_summary: { offer_count: 0, low_price_usd: null, high_price_usd: null } }),
    );
    expect(jsonLd).not.toHaveProperty("offers");
  });

  it("sin ean no trae gtin", () => {
    expect(productJsonLd(product({ ean: null }))).not.toHaveProperty("gtin");
  });
});
