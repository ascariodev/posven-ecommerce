import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { CategoryRail } from "@/features/search/components/CategoryRail";

const categories: CategoryNode[] = [
  { slug: "farmacia", name: "Farmacia", parent_slug: null, children: [] },
  { slug: "cuidado-personal", name: "Cuidado personal", parent_slug: null, children: [] },
];

afterEach(() => {
  cleanup();
});

describe("CategoryRail", () => {
  it("pone Todo primero y apunta a /buscar", () => {
    render(<CategoryRail categories={categories} />);
    const links = within(screen.getByRole("navigation", { name: "Categorías" })).getAllByRole("link");
    expect(links[0].textContent).toBe("Todo");
    expect(links[0].getAttribute("href")).toBe("/buscar");
  });

  it("lista cada categoría con su nombre accesible y su enlace", () => {
    render(<CategoryRail categories={categories} />);
    const farmacia = screen.getByRole("link", { name: "Farmacia" });
    expect(farmacia.getAttribute("href")).toContain("categoria=farmacia");
    expect(screen.getByRole("link", { name: "Cuidado personal" })).toBeTruthy();
  });

  it("sin categorías no pinta nada", () => {
    const { container } = render(<CategoryRail categories={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
