import "server-only";
import type { MetadataRoute } from "next";
import { listSitemap } from "@/lib/marketplace/client";
import { sitemapTypeSchema, type SitemapType } from "@/lib/marketplace/schemas";
import { SITE_URL } from "@/lib/site";

const STATIC_ID = "static";

const PATH_PREFIX: Record<SitemapType, string> = {
  products: "/p/",
  stores: "/tienda/",
};

async function pageCount(type: SitemapType): Promise<number> {
  const { meta } = await listSitemap({ type, page: 1 });
  return Math.max(1, Math.ceil(meta.total / meta.per_page));
}

export async function sitemapIds(): Promise<string[]> {
  const ids = [STATIC_ID];
  for (const type of sitemapTypeSchema.options) {
    const count = await pageCount(type);
    for (let page = 1; page <= count; page += 1) ids.push(`${type}-${page}`);
  }
  return ids;
}

function parseId(id: string): { type: SitemapType; page: number } | null {
  const match = /^([a-z]+)-([1-9]\d*)$/.exec(id);
  if (match === null) return null;
  const type = sitemapTypeSchema.safeParse(match[1]);
  return type.success ? { type: type.data, page: Number(match[2]) } : null;
}

export async function sitemapEntries(id: string): Promise<MetadataRoute.Sitemap> {
  if (id === STATIC_ID) return [{ url: SITE_URL }];
  const parsed = parseId(id);
  if (parsed === null) return [];
  const { data } = await listSitemap(parsed);
  return data.map((entry) => ({
    url: new URL(`${PATH_PREFIX[parsed.type]}${entry.slug}`, SITE_URL).href,
    lastModified: entry.updated_at,
  }));
}
