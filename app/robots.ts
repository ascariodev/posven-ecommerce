import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { sitemapIds } from "@/lib/sitemap";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const ids = await sitemapIds();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/buscar", "/api/", "/cuenta", "/carrito", "/checkout", "/restablecer/", "/verificar/"] },
    sitemap: ids.map((id) => new URL(`/sitemap/${id}.xml`, SITE_URL).href),
  };
}
