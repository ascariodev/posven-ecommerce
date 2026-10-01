import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RadiusFilter } from "@/features/search/components/RadiusFilter";

const query = { q: "acetaminofen", categoria: null, radio: 10 as const, pagina: 3 };

afterEach(() => {
  cleanup();
});

describe("RadiusFilter", () => {
  it("con coordenadas da cinco enlaces y marca el vigente", () => {
    render(<RadiusFilter query={query} geoKind="coords" cityName={null} />);
    const labels = screen.getAllByRole("link").map((link) => link.textContent);
    expect(labels).toEqual(["3 km", "10 km", "25 km", "50 km", "Todo el país"]);
    expect(screen.getByRole("link", { name: "10 km" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("link", { name: "25 km" }).getAttribute("href")).toBe("/buscar?q=acetaminofen&radio=25");
  });

  it("con ciudad da Sólo Valencia y Todo el país", () => {
    render(<RadiusFilter query={query} geoKind="city" cityName="Valencia" />);
    const labels = screen.getAllByRole("link").map((link) => link.textContent);
    expect(labels).toEqual(["Sólo Valencia", "Todo el país"]);
    expect(screen.getByRole("link", { name: "Todo el país" }).getAttribute("href")).toBe(
      "/buscar?q=acetaminofen&radio=pais",
    );
  });
});
