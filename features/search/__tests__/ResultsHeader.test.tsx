import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { ResultsHeader } from "@/features/search/components/ResultsHeader";

const categories: CategoryNode[] = [
  {
    slug: "farmacia",
    name: "Farmacia",
    parent_slug: null,
    children: [{ slug: "analgesicos", name: "Analgésicos", parent_slug: "farmacia", children: [] }],
  },
];

afterEach(() => {
  cleanup();
});

describe("ResultsHeader", () => {
  it("arma migas con la categoría padre, la hija y el texto, y el total con la ciudad", () => {
    render(
      <ResultsHeader
        query={{ q: "aspirina", categoria: "analgesicos", radio: 10, pagina: 1 }}
        categories={categories}
        total={12}
        geoKind="city"
        locationName="Naguanagua"
        showTotal
      />,
    );
    const crumbs = screen.getByRole("navigation", { name: "Migas de pan" });
    expect(crumbs.textContent).toBe("InicioFarmaciaAnalgésicosaspirina");
    expect(screen.getByRole("link", { name: "Farmacia" }).getAttribute("href")).toBe("/buscar?categoria=farmacia");
    expect(screen.getByRole("heading", { name: "aspirina" })).toBeTruthy();
    expect(screen.getByText("12 productos en Naguanagua")).toBeTruthy();
  });

  it("sin ubicación el total no menciona lugar y sin total no lo pinta", () => {
    render(
      <ResultsHeader
        query={{ q: "", categoria: "farmacia", radio: 10, pagina: 1 }}
        categories={categories}
        total={1}
        geoKind={null}
        locationName={null}
        showTotal
      />,
    );
    expect(screen.getByText("1 producto")).toBeTruthy();
    cleanup();
    render(
      <ResultsHeader
        query={{ q: "", categoria: "farmacia", radio: 10, pagina: 1 }}
        categories={categories}
        total={0}
        geoKind={null}
        locationName={null}
        showTotal={false}
      />,
    );
    expect(screen.queryByText(/producto/)).toBeNull();
  });
});
