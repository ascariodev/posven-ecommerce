import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listPurchases } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { RecentPurchases } from "./RecentPurchases";
import { purchase } from "./testPurchase";

vi.mock("@/lib/marketplace/client", () => ({ listPurchases: vi.fn() }));

const ctx = { session: "7|token", clientIp: null };

afterEach(() => {
  cleanup();
  vi.mocked(listPurchases).mockReset();
});

describe("RecentPurchases", () => {
  it("muestra las tres primeras de la página 1 y Ver todas", async () => {
    const codes = ["PV-000005", "PV-000004", "PV-000003", "PV-000002"];
    vi.mocked(listPurchases).mockResolvedValue({
      data: codes.map((code) => purchase({ code })),
      meta: { page: 1, per_page: 10, total: 4 },
    });

    render((await RecentPurchases({ ctx }))!);

    expect(listPurchases).toHaveBeenCalledWith(ctx, 1);
    const rows = within(screen.getByRole("list", { name: "Últimas compras" })).getAllByRole("link");
    expect(rows.map((row) => row.getAttribute("href"))).toEqual([
      "/cuenta/compras/PV-000005",
      "/cuenta/compras/PV-000004",
      "/cuenta/compras/PV-000003",
    ]);
    expect(screen.getByRole("link", { name: "Ver todas" }).getAttribute("href")).toBe("/cuenta/compras");
  });

  it.each([
    ["la API caída", new MarketplaceUnavailableError("/me/purchases")],
    ["un 429", new MarketplaceAccountError({ status: 429, code: "too_many_attempts", message: "Demasiados intentos.", retryAfter: 30 })],
  ])("con %s no pinta nada y el resumen sigue", async (_name, error) => {
    vi.mocked(listPurchases).mockRejectedValue(error);

    expect(await RecentPurchases({ ctx })).toBeNull();
  });

  it("un 401 sube: la sesión venció", async () => {
    vi.mocked(listPurchases).mockRejectedValue(
      new MarketplaceAccountError({ status: 401, code: "unauthenticated", message: "Inicia sesión para continuar." }),
    );

    await expect(RecentPurchases({ ctx })).rejects.toBeInstanceOf(MarketplaceAccountError);
  });

  it("sin compras no pinta nada", async () => {
    vi.mocked(listPurchases).mockResolvedValue({ data: [], meta: { page: 1, per_page: 10, total: 0 } });

    expect(await RecentPurchases({ ctx })).toBeNull();
  });
});
