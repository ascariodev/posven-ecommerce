import type { Store } from "@/lib/marketplace/schemas";
import { SITE_URL } from "@/lib/site";
import { openingHoursJsonLd } from "./schedule";

export function storeJsonLd(store: Store): object {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    url: new URL(`/tienda/${store.slug}`, SITE_URL).href,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address,
      addressLocality: store.city.name,
      addressCountry: "VE",
    },
    geo: { "@type": "GeoCoordinates", latitude: store.latitude, longitude: store.longitude },
    ...(store.phone !== null && { telephone: store.phone }),
    ...(store.schedule.length > 0 && { openingHoursSpecification: openingHoursJsonLd(store.schedule) }),
    ...(store.logo_url !== null && { image: store.logo_url }),
  };
}
