import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { RadiusKm } from "@/lib/marketplace/params";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import type { SearchQuery } from "@/features/search/lib/query";
import { EmptyState } from "@/features/search/components/EmptyState";

const categories: CategoryNode[] = [
  {
    slug: "farmacia",
    name: "Farmacia",
    parent_slug: null,
    children: [
      { slug: "analgesicos", name: "Analgésicos", parent_slug: "farmacia", children: [] },
      { slug: "antibioticos", name: "Antibióticos", parent_slug: "farmacia", children: [] },
    ],
  },
  { slug: "viveres", name: "Víveres", parent_slug: null, children: [] },
];

function renderEmpty(
  geoKind: "coords" | "city" | null,
  radio: RadiusKm | null,
  categoria: string | null = null,
  extra: Partial<SearchQuery> = {},
  nearby?: ReactNode,
) {
  render(
    <EmptyState
      query={{ q: "zzzz", categoria, radio, pagina: 1, ...extra }}
      geoKind={geoKind}
      categories={categories}
      nearby={nearby}
    />,
  );
}

afterEach(() => {
  cleanup();
});

describe("EmptyState", () => {
  it("con coordenadas y radio 10 ofrece ampliar a 25 km", () => {
    renderEmpty("coords", 10);
    expect(screen.getByRole("link", { name: "Ampliar a 25 km" }).getAttribute("href")).toBe(
      "/buscar?q=zzzz&radio=25",
    );
  });

  it("con coordenadas y radio 50 no ofrece ampliar y sí todo el país", () => {
    renderEmpty("coords", 50);
    expect(screen.queryByRole("link", { name: /Ampliar/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Buscar en todo el país" }).getAttribute("href")).toBe(
      "/buscar?q=zzzz&radio=pais",
    );
  });

  it("con ciudad y radio 10 sólo ofrece todo el país", () => {
    renderEmpty("city", 10);
    expect(screen.queryByRole("link", { name: /Ampliar/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Buscar en todo el país" })).toBeTruthy();
  });

  it("con radio null no ofrece ampliar ni todo el país", () => {
    renderEmpty("coords", null);
    expect(screen.queryByRole("link", { name: /Ampliar/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "Buscar en todo el país" })).toBeNull();
  });

  it("sin ubicación no ofrece ampliar ni todo el país", () => {
    renderEmpty(null, 10);
    expect(screen.queryByRole("link", { name: /Ampliar/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "Buscar en todo el país" })).toBeNull();
  });

  it("siempre enlaza a /comercios", () => {
    renderEmpty(null, null);
    expect(screen.getByRole("link", { name: "¿Tienes un comercio? Aparece en posven" }).getAttribute("href")).toBe(
      "/comercios",
    );
  });

  it("con categoría sugiere sus hermanas", () => {
    renderEmpty(null, 10, "analgesicos");
    expect(screen.getByRole("link", { name: "Antibióticos" }).getAttribute("href")).toBe(
      "/buscar?categoria=antibioticos",
    );
    expect(screen.queryByRole("link", { name: "Analgésicos" })).toBeNull();
  });

  it("con Abierto ahora activo ofrece quitarlo y conserva orden, radio y texto", () => {
    renderEmpty("coords", 25, null, { openNow: true, sort: "price" });
    expect(screen.getByRole("link", { name: "Quitar «Abierto ahora»" }).getAttribute("href")).toBe(
      "/buscar?q=zzzz&radio=25&orden=precio",
    );
  });

  it("sin Abierto ahora no ofrece quitarlo", () => {
    renderEmpty("coords", 25);
    expect(screen.queryByRole("link", { name: /Quitar/ })).toBeNull();
  });

  it("los enlaces de ampliar conservan orden y abierto", () => {
    renderEmpty("coords", 10, null, { openNow: true, sort: "distance" });
    expect(screen.getByRole("link", { name: "Ampliar a 25 km" }).getAttribute("href")).toBe(
      "/buscar?q=zzzz&radio=25&abierto=1&orden=cercania",
    );
  });

  it("pinta el bloque de productos cercanos que recibe", () => {
    renderEmpty(null, 10, null, {}, <p>Quizás te sirve</p>);
    expect(screen.getByText("Quizás te sirve")).toBeTruthy();
  });
});
