import type { Metadata } from "next";
import type { ProductDetail } from "@/lib/marketplace/schemas";

function storesLabel(count: number): string {
  return count === 1 ? "1 tienda" : `${count} tiendas`;
}

export function productMetadata(product: ProductDetail): Metadata {
  const offerCount = product.offers_summary.offer_count;
  const metadata: Metadata = {
    title: product.name,
    description:
      offerCount > 0
        ? `Compara el precio de ${product.name} en ${storesLabel(offerCount)} y encuentra la más cerca.`
        : `${product.name}: sin disponibilidad ahora.`,
    alternates: { canonical: `/p/${product.slug}` },
  };
  if (product.image_url !== null) metadata.openGraph = { images: [product.image_url] };
  if (offerCount === 0) metadata.robots = { index: false, follow: true };
  return metadata;
}
