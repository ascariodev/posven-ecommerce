import { Skeleton } from "@/components/ui/skeleton";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { getEffectiveLocation } from "@/features/location/server/location";
import { formatRate } from "@/lib/format";
import { getProductOffers } from "@/lib/marketplace/client";
import { DEFAULT_RADIUS_KM, type OfferSort } from "@/lib/marketplace/params";
import type { ProductDetail } from "@/lib/marketplace/schemas";
import { OfferCard } from "./OfferCard";
import { SortLinks } from "./SortLinks";

export async function ProductOffers({
  product,
  searchParams,
}: {
  product: Pick<ProductDetail, "slug" | "name" | "restriction">;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { location } = await getEffectiveLocation();
  const { orden } = await searchParams;
  const sort: OfferSort = location !== null && orden === "cerca" ? "distance" : "price";
  const geo = toGeoFilter(location);
  const response = await getProductOffers({
    slug: product.slug,
    geo,
    radiusKm: geo ? DEFAULT_RADIUS_KM : null,
    sort,
  });
  const now = new Date();

  const page = response === null || "redirect_to" in response ? null : response;
  if (page === null || (page.offers.length === 0 && page.featured.length === 0)) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight">Dónde comprarlo</h2>
        <p className="text-muted-foreground">No hay ofertas cerca. Prueba con otra ciudad.</p>
      </section>
    );
  }

  const inside = page.offers.filter((offer) => !offer.outside_radius);
  const outside = page.offers.filter((offer) => offer.outside_radius);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight">Dónde comprarlo</h2>
      <p className="text-sm text-muted-foreground">{formatRate(page.rate)}</p>
      {location !== null && <SortLinks slug={product.slug} sort={sort} />}
      {page.featured.length + inside.length > 0 && (
        <ul aria-label="Ofertas" className="flex flex-col gap-3">
          {page.featured.map((offer) => (
            <li key={`destacada:${offer.store.slug}`}>
              <OfferCard offer={offer} product={product} featured best={false} now={now} />
            </li>
          ))}
          {inside.map((offer, index) => (
            <li key={offer.store.slug}>
              <OfferCard offer={offer} product={product} featured={false} best={sort === "price" && page.featured.length === 0 && index === 0} now={now} />
            </li>
          ))}
        </ul>
      )}
      {outside.length > 0 && (
        <>
          <h3 className="text-lg font-bold tracking-tight">Fuera de tu zona</h3>
          <ul aria-label="Fuera de tu zona" className="flex flex-col gap-3">
            {outside.map((offer) => (
              <li key={offer.store.slug}>
                <OfferCard offer={offer} product={product} featured={false} best={false} now={now} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function ProductOffersSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-48" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-44" />
        ))}
      </div>
    </div>
  );
}
