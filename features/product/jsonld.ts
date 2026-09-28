import type { ProductDetail } from "@/lib/marketplace/schemas";
import { SITE_URL } from "@/lib/site";

export function productJsonLd(product: ProductDetail): object {
  const summary = product.offers_summary;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: new URL(`/p/${product.slug}`, SITE_URL).href,
    ...(product.image_url !== null && { image: product.image_url }),
    ...(product.brand !== null && { brand: { "@type": "Brand", name: product.brand } }),
    ...(product.ean !== null && { gtin: product.ean }),
    ...(product.category !== null && { category: product.category.name }),
    ...(summary.offer_count > 0 && {
      offers: {
        "@type": "AggregateOffer",
        lowPrice: summary.low_price_usd,
        highPrice: summary.high_price_usd,
        offerCount: summary.offer_count,
        priceCurrency: "USD",
      },
    }),
  };
}
