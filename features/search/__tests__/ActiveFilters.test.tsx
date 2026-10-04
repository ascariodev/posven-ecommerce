import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ActiveFilters } from "@/features/search/components/ActiveFilters";
import type { CategoryNode } from "@/lib/marketplace/schemas";

const categories = [{ slug: "salud", name: "Salud", children: [] }] as unknown as CategoryNode[];
const base = { q: "acetaminofen", categoria: null, radio: 10 as const, pagina: 3 };

afterEach(() => {
  cleanup();
});

describe("ActiveFilters", () => {
  it("sin filtros activos no pinta nada", () => {
    const { container } = render(<ActiveFilters query={base} categories={categories} hasLocation />);
    expect(container.innerHTML).toBe("");
  });

  it("pinta un chip por filtro y cada uno lo quita volviendo a la página 1", () => {
    const query = { ...base, categoria: "salud", radio: 25 as const, openNow: true, sort: "price" as const };
    render(<ActiveFilters query={query} categories={categories} hasLocation />);
    expect(screen.getByRole("link", { name: "Quitar filtro Salud" }).getAttribute("href")).toBe(
      "/buscar?q=acetaminofen&radio=25&abierto=1&orden=precio",
    );
    expect(screen.getByRole("link", { name: "Quitar filtro 25 km" }).getAttribute("href")).toBe(
      "/buscar?q=acetaminofen&categoria=salud&abierto=1&orden=precio",
    );
    expect(screen.getByRole("link", { name: "Quitar filtro Abierto ahora" }).getAttribute("href")).toBe(
      "/buscar?q=acetaminofen&categoria=salud&radio=25&orden=precio",
    );
  });

  it("Limpiar filtros quita todo y conserva texto y orden", () => {
    const query = { ...base, categoria: "salud", radio: null, openNow: true, sort: "price" as const };
    render(<ActiveFilters query={query} categories={categories} hasLocation />);
    expect(screen.getByRole("link", { name: "Limpiar filtros" }).getAttribute("href")).toBe(
      "/buscar?q=acetaminofen&orden=precio",
    );
  });

  it("sin texto la categoría no es un chip y Limpiar filtros la conserva", () => {
    const query = { q: "", categoria: "salud", radio: 10 as const, pagina: 1, openNow: true };
    render(<ActiveFilters query={query} categories={categories} hasLocation={false} />);
    expect(screen.queryByRole("link", { name: "Quitar filtro Salud" })).toBeNull();
    expect(screen.getByRole("link", { name: "Limpiar filtros" }).getAttribute("href")).toBe(
      "/buscar?categoria=salud",
    );
  });

  it("sin ubicación el radio no cuenta como filtro", () => {
    render(<ActiveFilters query={{ ...base, radio: null }} categories={categories} hasLocation={false} />);
    expect(screen.queryByRole("navigation", { name: "Filtros activos" })).toBeNull();
  });
});
