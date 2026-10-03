import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { formatDateTime } from "@/features/purchases/lib/labels";
import { PurchaseList } from "@/features/purchases/components/PurchaseList";
import { order, purchase } from "@/features/purchases/__tests__/fixtures/testPurchase";

afterEach(() => {
  cleanup();
});

describe("formatDateTime", () => {
  it("da la fecha y la hora de Caracas", () => {
    expect(formatDateTime("2026-09-30T18:00:00Z")).toBe("30/09/2026 14:00");
    expect(formatDateTime("2026-10-01T02:30:00Z")).toBe("30/09/2026 22:30");
  });
});

describe("PurchaseList", () => {
  it("cada fila lleva código, estado, fecha, tiendas y total, enlazada a su detalle", () => {
    render(
      <PurchaseList
        page={{ data: [purchase({ orders: [order(), order()] })], meta: { page: 1, per_page: 10, total: 1 } }}
      />,
    );

    const link = within(screen.getByRole("list", { name: "Compras" })).getByRole("link");
    expect(link.getAttribute("href")).toBe("/cuenta/compras/PV-00000A");
    expect(link.textContent).toContain("PV-00000A");
    expect(link.textContent).toContain("Pagada");
    expect(link.textContent).toContain("30/09/2026 14:00 · 2 tiendas");
    expect(link.textContent).toContain("$ 6,70Bs 244,55");
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("sin compras invita a buscar", () => {
    render(<PurchaseList page={{ data: [], meta: { page: 1, per_page: 10, total: 0 } }} />);

    expect(screen.getByText("Todavía no tienes compras.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Buscar productos" }).getAttribute("href")).toBe("/buscar");
  });

  it("en la primera de dos páginas sólo ofrece Siguientes", () => {
    render(<PurchaseList page={{ data: [purchase()], meta: { page: 1, per_page: 10, total: 11 } }} />);

    const nav = screen.getByRole("navigation", { name: "Páginas de compras" });
    expect(within(nav).queryByRole("link", { name: "Anteriores" })).toBeNull();
    expect(within(nav).getByRole("link", { name: "Siguientes" }).getAttribute("href")).toBe("/cuenta/compras?pagina=2");
  });

  it("en la última página sólo ofrece Anteriores, hacia la primera sin parámetro", () => {
    render(<PurchaseList page={{ data: [purchase()], meta: { page: 2, per_page: 10, total: 11 } }} />);

    const nav = screen.getByRole("navigation", { name: "Páginas de compras" });
    expect(within(nav).getByRole("link", { name: "Anteriores" }).getAttribute("href")).toBe("/cuenta/compras");
    expect(within(nav).queryByRole("link", { name: "Siguientes" })).toBeNull();
  });
});
