import { getEffectiveLocation } from "@/features/location/server/location";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { relatedSections } from "@/features/product/lib/related";
import { ProductCard } from "@/features/search/components/ProductCard";
import { searchProducts } from "@/lib/marketplace/client";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";

export async function RelatedProducts({
  currentSlug,
  categorySlug,
  section,
}: {
  currentSlug: string;
  categorySlug: string | null;
  section: "together" | "alsoViewed";
}) {
  const { location } = await getEffectiveLocation();
  const geo = toGeoFilter(location);
  const search = (category: string | null) =>
    searchProducts({
      q: "",
      category,
      geo,
      radiusKm: geo ? DEFAULT_RADIUS_KM : null,
      page: 1,
    });
  const [together, alsoViewed] = await Promise.all([search(categorySlug), search(null)]);
  const sections = relatedSections(currentSlug, together.data, alsoViewed.data);
  const items = sections[section];
  const title = section === "together" ? "Cómpralos juntos" : "También vistos por otros clientes";

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">{title}</h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item) => (
          <li key={item.slug}>
            <ProductCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
