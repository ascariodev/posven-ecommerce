import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { searchHref } from "@/features/search/lib/query";
import { Pagination } from "@/features/search/components/Pagination";

afterEach(() => {
  cleanup();
});

function renderPage(page: number, total: number) {
  render(
    <Pagination
      meta={{ page, per_page: 20, total }}
      hrefForPage={(pagina) => searchHref({ q: "arroz", categoria: null, radio: 10, pagina, sort: "price" })}
    />,
  );
}

describe("Pagination", () => {
  it("muestra la primera, la última y las vecinas con elipsis y conserva el orden en los enlaces", () => {
    renderPage(5, 200);
    const nav = screen.getByRole("navigation", { name: "Paginación" });
    expect(nav.textContent).toBe("Anterior1…456…10Siguiente");
    expect(screen.getByRole("link", { name: "Ir a la página 6" }).getAttribute("href")).toBe(
      "/buscar?q=arroz&orden=precio&pagina=6",
    );
    expect(screen.getByRole("link", { name: "Ir a la página 1" }).getAttribute("href")).toBe(
      "/buscar?q=arroz&orden=precio",
    );
  });

  it("marca la página actual y en la primera no ofrece Anterior", () => {
    renderPage(1, 40);
    expect(screen.queryByRole("link", { name: "Anterior" })).toBeNull();
    expect(screen.getByLabelText("Página 1 de 2").getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Siguiente" })).toBeTruthy();
  });
});
