import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { CategoryTiles } from "@/features/search/components/CategoryTiles";

function node(slug: string, name: string): CategoryNode {
  return { slug, name, parent_slug: null, children: [] };
}

const roots: CategoryNode[] = [
  node("salud-y-medicamentos", "Salud y medicamentos"),
  node("alimentos", "Alimentos"),
  node("bebidas", "Bebidas"),
  node("ferreteria", "Ferretería"),
];

afterEach(() => {
  cleanup();
});

describe("CategoryTiles", () => {
  it("pinta el título y un enlace por raíz con foto, armado con searchHref", () => {
    render(<CategoryTiles categories={roots} />);
    expect(screen.getByRole("heading", { name: "Compra por categoría" })).toBeTruthy();
    const links = within(screen.getByRole("list")).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/buscar?categoria=salud-y-medicamentos",
      "/buscar?categoria=alimentos",
      "/buscar?categoria=bebidas",
      "/buscar?categoria=ferreteria",
    ]);
    expect(links.map((link) => link.textContent)).toEqual(roots.map((root) => root.name));
  });

  it("deja fuera las categorías sin foto", () => {
    render(<CategoryTiles categories={[node("mascotas", "Mascotas"), node("bebidas", "Bebidas")]} />);
    expect(screen.queryByText("Mascotas")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("sin ninguna foto no pinta nada", () => {
    const { container } = render(<CategoryTiles categories={[node("mascotas", "Mascotas")]} />);
    expect(container.innerHTML).toBe("");
  });
});
