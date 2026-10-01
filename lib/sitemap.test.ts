import { afterEach, describe, expect, it, vi } from "vitest";
import { listSitemap } from "@/lib/marketplace/client";
import type { SitemapResponse } from "@/lib/marketplace/schemas";
import { SITE_URL } from "@/lib/site";
import { sitemapEntries, sitemapIds } from "./sitemap";

vi.mock("@/lib/marketplace/client", () => ({
  listSitemap: vi.fn(),
}));

function response(total: number, perPage: number, slugs: string[] = []): SitemapResponse {
  return {
    data: slugs.map((slug) => ({ slug, updated_at: "2026-09-26T14:30:00Z" })),
    meta: { page: 1, per_page: perPage, total },
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("sitemapIds", () => {
  it("con total 3 y per_page 2 parte cada tipo en dos sitemaps", async () => {
    vi.mocked(listSitemap).mockResolvedValue(response(3, 2));

    expect(await sitemapIds()).toEqual(["static", "products-1", "products-2", "stores-1", "stores-2"]);
  });

  it("con total 0 deja al menos el primer sitemap de cada tipo", async () => {
    vi.mocked(listSitemap).mockResolvedValue(response(0, 2));

    expect(await sitemapIds()).toEqual(["static", "products-1", "stores-1"]);
  });
});

describe("sitemapEntries", () => {
  it("products-1 da URLs absolutas de producto con lastModified", async () => {
    vi.mocked(listSitemap).mockResolvedValue(response(1, 2, ["acetaminofen-500-mg-20-tabletas"]));

    expect(await sitemapEntries("products-1")).toEqual([
      {
        url: `${SITE_URL}/p/acetaminofen-500-mg-20-tabletas`,
        lastModified: "2026-09-26T14:30:00Z",
      },
    ]);
    expect(listSitemap).toHaveBeenCalledWith({ type: "products", page: 1 });
  });

  it("static da la portada y /comercios sin llamar a la API", async () => {
    expect(await sitemapEntries("static")).toEqual([
      { url: SITE_URL },
      { url: `${SITE_URL}/comercios` },
    ]);
    expect(listSitemap).not.toHaveBeenCalled();
  });

  it("un id desconocido da una lista vacía sin llamar a la API", async () => {
    expect(await sitemapEntries("categorias-1")).toEqual([]);
    expect(listSitemap).not.toHaveBeenCalled();
  });
});
