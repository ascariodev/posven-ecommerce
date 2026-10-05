import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listCategories } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { SiteFooter } from "@/features/site/components/SiteFooter";

vi.mock("@/lib/marketplace/client", () => ({
  listCategories: vi.fn(),
}));

vi.mock("@/features/site/lib/year", () => ({
  footerYear: vi.fn().mockResolvedValue(2026),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function root(slug: string): CategoryNode {
  return { slug, name: `Categoría ${slug}`, parent_slug: null, children: [] };
}

describe("SiteFooter", () => {
  it("pinta las categorías raíz, los enlaces de comercios y legales y el año", async () => {
    vi.mocked(listCategories).mockResolvedValue([root("salud")]);

    render(await SiteFooter());

    const categories = screen.getByRole("navigation", { name: "Categorías" });
    expect(within(categories).getByRole("link", { name: "Categoría salud" })).toHaveProperty(
      "href",
      expect.stringContaining("/buscar?categoria=salud"),
    );
    expect(screen.getByRole("link", { name: "Para comercios" }).getAttribute("href")).toBe("/comercios");
    expect(screen.getByRole("link", { name: "Centro de ayuda" }).getAttribute("href")).toBe("/ayuda");
    expect(screen.getByRole("link", { name: "Términos" }).getAttribute("href")).toBe("/terminos");
    expect(screen.getByRole("link", { name: "Privacidad" }).getAttribute("href")).toBe("/privacidad");
    expect(screen.getByText(/© 2026/)).toBeTruthy();
  });

  it("corta las categorías en 8", async () => {
    vi.mocked(listCategories).mockResolvedValue(Array.from({ length: 12 }, (_, i) => root(`c${i}`)));

    render(await SiteFooter());

    const categories = screen.getByRole("navigation", { name: "Categorías" });
    expect(within(categories).getAllByRole("link")).toHaveLength(8);
  });

  it("omite la columna de categorías si la API falla", async () => {
    vi.mocked(listCategories).mockRejectedValue(new MarketplaceUnavailableError("/categories"));

    render(await SiteFooter());

    expect(screen.queryByRole("navigation", { name: "Categorías" })).toBeNull();
    expect(screen.getByRole("link", { name: "Para comercios" })).toBeTruthy();
  });

  it("omite la columna de categorías si no hay raíces", async () => {
    vi.mocked(listCategories).mockResolvedValue([]);

    render(await SiteFooter());

    expect(screen.queryByRole("navigation", { name: "Categorías" })).toBeNull();
  });

  it("relanza un error que no es de la API", async () => {
    vi.mocked(listCategories).mockRejectedValue(new Error("boom"));

    await expect(SiteFooter()).rejects.toThrow("boom");
  });
});
