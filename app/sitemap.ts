import type { MetadataRoute } from "next";
import { sitemapEntries, sitemapIds } from "@/lib/sitemap";

export async function generateSitemaps(): Promise<{ id: string }[]> {
  return (await sitemapIds()).map((id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  return sitemapEntries(id);
}
