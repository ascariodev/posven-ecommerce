import { describe, expect, it } from "vitest";
import type { ProductDetail } from "@/lib/marketplace/schemas";
import { productMetadata } from "./metadata";

function product(offerCount: number): ProductDetail {
  return {
    slug: "acetaminofen-500-mg-20-tabletas",
    name: "Acetaminofén 500 mg x 20 tabletas",
    ean: "7590000000011",
    brand: "Genven",
    category: null,
    image_url: null,
    attributes: [],
    restriction: "none",
    is_unified: true,
    offers_summary: {
      offer_count: offerCount,
      low_price_usd: offerCount > 0 ? "2.35" : null,
      high_price_usd: offerCount > 0 ? "2.80" : null,
    },
  };
}

describe("productMetadata", () => {
  it("con ofertas lleva la canónica /p/{slug} y la descripción en plural", () => {
    const metadata = productMetadata(product(4));
    expect(metadata.alternates?.canonical).toBe("/p/acetaminofen-500-mg-20-tabletas");
    expect(metadata.description).toBe(
      "Compara el precio de Acetaminofén 500 mg x 20 tabletas en 4 tiendas y encuentra la más cerca.",
    );
    expect(metadata.robots).toBeUndefined();
  });

  it("con una oferta dice 1 tienda", () => {
    expect(productMetadata(product(1)).description).toBe(
      "Compara el precio de Acetaminofén 500 mg x 20 tabletas en 1 tienda y encuentra la más cerca.",
    );
  });

  it("sin ofertas lleva noindex y la descripción de sin disponibilidad", () => {
    const metadata = productMetadata(product(0));
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.description).toBe("Acetaminofén 500 mg x 20 tabletas: sin disponibilidad ahora.");
  });
});
