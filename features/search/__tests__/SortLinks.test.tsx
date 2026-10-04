import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SortLinks } from "@/features/search/components/SortLinks";

afterEach(() => {
  cleanup();
});

const base = { q: "arroz", categoria: null, radio: 10 as const, pagina: 3 };

describe("SortLinks", () => {
  it("con ubicación marca Más cercano por defecto y Menor precio escribe orden=precio en la página 1", () => {
    render(<SortLinks query={base} hasLocation />);
    expect(screen.getByRole("link", { name: "Más cercano" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("link", { name: "Menor precio" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: "Menor precio" }).getAttribute("href")).toBe("/buscar?q=arroz&orden=precio");
    expect(screen.getByRole("link", { name: "Más cercano" }).getAttribute("href")).toBe("/buscar?q=arroz");
  });

  it("con ubicación y sort price marca Menor precio", () => {
    render(<SortLinks query={{ ...base, sort: "price" }} hasLocation />);
    expect(screen.getByRole("link", { name: "Menor precio" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("link", { name: "Más cercano" }).getAttribute("aria-current")).toBeNull();
  });

  it("sin ubicación ofrece Relevancia, actual por defecto, y no Más cercano", () => {
    render(<SortLinks query={base} hasLocation={false} />);
    expect(screen.queryByRole("link", { name: "Más cercano" })).toBeNull();
    expect(screen.getByRole("link", { name: "Relevancia" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("link", { name: "Menor precio" }).getAttribute("aria-current")).toBeNull();
  });

  it("sin ubicación y sort price marca Menor precio", () => {
    render(<SortLinks query={{ ...base, sort: "price" }} hasLocation={false} />);
    expect(screen.getByRole("link", { name: "Menor precio" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("link", { name: "Relevancia" }).getAttribute("aria-current")).toBeNull();
  });

  it("sin ubicación y orden=cercania deja Relevancia como actual", () => {
    render(<SortLinks query={{ ...base, sort: "distance" }} hasLocation={false} />);
    expect(screen.getByRole("link", { name: "Relevancia" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("link", { name: "Menor precio" }).getAttribute("aria-current")).toBeNull();
  });
});
