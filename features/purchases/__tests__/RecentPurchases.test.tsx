import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatUsd } from "@/lib/format";
import { listPurchases } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { LastPurchase, RecentPurchases } from "@/features/purchases/components/RecentPurchases";
import { order, purchase } from "@/features/purchases/__tests__/fixtures/testPurchase";

vi.mock("@/lib/marketplace/client", () => ({ listPurchases: vi.fn() }));

const ctx = { session: "7|token", clientIp: null };

afterEach(() => {
  cleanup();
  vi.mocked(listPurchases).mockReset();
});

describe("RecentPurchases", () => {
  it("muestra las tres primeras de la página 1 en filas y en tabla, y Ver todas", async () => {
    const codes = ["PV-000005", "PV-000004", "PV-000003", "PV-000002"];
    vi.mocked(listPurchases).mockResolvedValue({
      data: codes.map((code) => purchase({ code })),
      meta: { page: 1, per_page: 10, total: 4 },
    });

    render((await RecentPurchases({ ctx }))!);

    expect(listPurchases).toHaveBeenCalledWith(ctx, 1);
    const expected = ["/cuenta/compras/PV-000005", "/cuenta/compras/PV-000004", "/cuenta/compras/PV-000003"];
    const rows = within(screen.getByRole("list", { name: "Compras recientes" })).getAllByRole("link");
    expect(rows.map((row) => row.getAttribute("href"))).toEqual(expected);
    const table = screen.getByRole("table", { name: "Compras recientes" });
    expect(within(table).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(expected);
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Código",
      "Fecha",
      "Tiendas",
      "Total",
      "Estado",
    ]);
    expect(screen.getByRole("link", { name: "Ver todas" }).getAttribute("href")).toBe("/cuenta/compras");
  });

  it("la fila trae la tienda sin repetirla, el total y el estado", async () => {
    vi.mocked(listPurchases).mockResolvedValue({
      data: [purchase({ orders: [order({ status: "accepted", pickup_code: null }), order({ status: "accepted", pickup_code: null })] })],
      meta: { page: 1, per_page: 10, total: 1 },
    });

    render((await RecentPurchases({ ctx }))!);

    const row = within(screen.getByRole("table", { name: "Compras recientes" })).getAllByRole("row")[1];
    expect(within(row).getByText("Farmacia Central")).toBeTruthy();
    expect(within(row).getByText("Preparando")).toBeTruthy();
    expect(within(row).getByText(formatUsd("6.70"))).toBeTruthy();
  });

  it("sin compras no pinta nada", async () => {
    vi.mocked(listPurchases).mockResolvedValue({ data: [], meta: { page: 1, per_page: 10, total: 0 } });

    expect(await RecentPurchases({ ctx })).toBeNull();
    expect(await LastPurchase({ ctx })).toBeNull();
  });

  it.each([
    ["la API caída", new MarketplaceUnavailableError("/me/purchases")],
    ["un 429", new MarketplaceAccountError({ status: 429, code: "too_many_attempts", message: "Demasiados intentos.", retryAfter: 30 })],
  ])("con %s no pinta nada y el resumen sigue", async (_name, error) => {
    vi.mocked(listPurchases).mockRejectedValue(error);

    expect(await RecentPurchases({ ctx })).toBeNull();
    expect(await LastPurchase({ ctx })).toBeNull();
  });

  it("un 401 sube: la sesión venció", async () => {
    vi.mocked(listPurchases).mockRejectedValue(
      new MarketplaceAccountError({ status: 401, code: "unauthenticated", message: "Inicia sesión para continuar." }),
    );

    await expect(RecentPurchases({ ctx })).rejects.toBeInstanceOf(MarketplaceAccountError);
    await expect(LastPurchase({ ctx })).rejects.toBeInstanceOf(MarketplaceAccountError);
  });
});

describe("LastPurchase", () => {
  it("Tu última compra muestra la primera con estado, tiendas, total y Ver seguimiento", async () => {
    vi.mocked(listPurchases).mockResolvedValue({
      data: [
        purchase({
          code: "PV-000009",
          orders: [order({ status: "accepted", pickup_code: null }), order({ status: "accepted", pickup_code: null })],
        }),
        purchase({ code: "PV-000008" }),
      ],
      meta: { page: 1, per_page: 10, total: 2 },
    });

    render((await LastPurchase({ ctx }))!);

    const card = screen.getByRole("region", { name: "Tu última compra" });
    expect(within(card).getByText("PV-000009")).toBeTruthy();
    expect(within(card).getByText("Preparando")).toBeTruthy();
    expect(within(card).getByText(/2 tiendas/)).toBeTruthy();
    expect(within(card).getByText(formatUsd("6.70"))).toBeTruthy();
    expect(within(card).getByRole("link", { name: "Ver seguimiento" }).getAttribute("href")).toBe("/cuenta/compras/PV-000009");
  });

  it("pinta la tarjeta Para retirar con el primer pedido listo y su código", async () => {
    vi.mocked(listPurchases).mockResolvedValue({
      data: [
        purchase({ code: "PV-000009", orders: [order({ status: "accepted", pickup_code: null })] }),
        purchase({ code: "PV-000008", orders: [order({ pickup_code: "111222" }), order({ pickup_code: "333444" })] }),
      ],
      meta: { page: 1, per_page: 10, total: 2 },
    });

    render((await LastPurchase({ ctx }))!);

    expect(listPurchases).toHaveBeenCalledTimes(1);
    const card = screen.getByRole("region", { name: "Para retirar" });
    expect(within(card).getByText("111222")).toBeTruthy();
    expect(within(card).queryByText("333444")).toBeNull();
    expect(within(card).getByText(/Farmacia Central · PV-000008/)).toBeTruthy();
    expect(within(card).getByRole("link").getAttribute("href")).toBe("/cuenta/compras/PV-000008");
  });

  it("la tarjeta de la última compra avisa que la tienda ya está lista para retirar", async () => {
    vi.mocked(listPurchases).mockResolvedValue({ data: [purchase()], meta: { page: 1, per_page: 10, total: 1 } });

    render((await LastPurchase({ ctx }))!);

    const card = screen.getByRole("region", { name: "Tu última compra" });
    expect(within(card).getByText("Listo para retirar")).toBeTruthy();
    expect(within(card).getByText(/Farmacia Central ya está lista para retirar/)).toBeTruthy();
  });

  it("sin pedido listo con código no pinta Para retirar", async () => {
    vi.mocked(listPurchases).mockResolvedValue({
      data: [purchase({ orders: [order({ status: "ready_for_pickup", pickup_code: null }), order({ status: "accepted" })] })],
      meta: { page: 1, per_page: 10, total: 1 },
    });

    render((await LastPurchase({ ctx }))!);

    expect(screen.queryByRole("region", { name: "Para retirar" })).toBeNull();
    expect(screen.getByRole("region", { name: "Tu última compra" })).toBeTruthy();
  });
});
