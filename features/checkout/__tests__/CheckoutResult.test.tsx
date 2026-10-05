import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPurchase } from "@/lib/marketplace/client";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import type { Purchase, PurchaseStatus } from "@/lib/marketplace/schemas";
import { order } from "@/features/purchases/__tests__/fixtures/testPurchase";
import { CheckoutResult } from "@/features/checkout/components/CheckoutResult";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/features/account/server/session", () => ({
  requireCustomer: vi.fn(async () => ({ ctx: { session: "7|token", clientIp: null }, customer: {} })),
}));
vi.mock("@/lib/marketplace/client", () => ({ getPurchase: vi.fn() }));

function purchase(status: PurchaseStatus): Purchase {
  return {
    code: "PV-00000A",
    status,
    created_at: "2026-09-30T14:00:00-04:00",
    paid_at: null,
    total_usd: "6.50",
    total_ves: "237.25",
    charge: { currency: "VES", amount: "237.25" },
    rate: { usd_ves: "36.50", valid_on: "2026-09-26" },
    orders: [],
  };
}

beforeEach(() => {
  vi.mocked(getPurchase).mockReset();
});

afterEach(() => {
  cleanup();
});

describe("CheckoutResult", () => {
  it("pendiente: confirma y consulta, con un enlace para consultar de nuevo", async () => {
    vi.mocked(getPurchase).mockResolvedValue(purchase("pending_payment"));

    render(await CheckoutResult({ code: "PV-00000A" }));

    expect(screen.getByRole("heading", { level: 1, name: "Estamos confirmando tu pago" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Consultando el estado…");
    expect(screen.getByRole("link", { name: "Consultar de nuevo" }).getAttribute("href")).toBe(
      "/checkout/resultado?compra=PV-00000A",
    );
  });

  it("pagada: código, lo cobrado, un bloque por tienda con su línea de estados y el código de retiro", async () => {
    const delivery = order({
      store: { ...order().store, slug: "farmacia-norte", name: "Farmacia Norte" },
      fulfillment: "delivery",
      status: "accepted",
      pickup_code: null,
      timeline: { ...order().timeline, ready_at: null },
    });
    vi.mocked(getPurchase).mockResolvedValue({ ...purchase("paid"), orders: [order(), delivery] });

    render(await CheckoutResult({ code: "PV-00000A" }));

    expect(screen.getByRole("heading", { level: 1, name: "¡Pago confirmado!" })).toBeTruthy();
    expect(screen.getByText("PV-00000A")).toBeTruthy();
    expect(screen.getByText(/pagaste Bs 237,25/)).toBeTruthy();
    expect(screen.getByText("Total $ 6,50 · Bs 237,25")).toBeTruthy();
    expect(screen.getAllByRole("list", { name: "Estado del pedido" })).toHaveLength(2);
    expect(screen.getByRole("heading", { level: 2, name: "Farmacia Central · retiro en tienda" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Farmacia Norte · entrega a domicilio" })).toBeTruthy();
    expect(screen.getAllByText("1 producto · $ 6,70")).toHaveLength(2);
    expect(screen.getAllByText("Código de retiro")).toHaveLength(1);
    expect(screen.getByText("482913")).toBeTruthy();
    const norte = screen.getAllByRole("list", { name: "Estado del pedido" })[1];
    expect(within(norte).getByText("Preparando")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver mis compras" }).getAttribute("href")).toBe("/cuenta/compras");
    expect(screen.getByRole("link", { name: "Seguir comprando" }).getAttribute("href")).toBe("/");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it.each<[PurchaseStatus, string]>([
    ["failed", "El pago no se completó"],
    ["expired", "La compra venció sin pago"],
  ])("%s: lo dice y vuelve al carrito", async (status, heading) => {
    vi.mocked(getPurchase).mockResolvedValue(purchase(status));

    render(await CheckoutResult({ code: "PV-00000A" }));

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeTruthy();
    expect(screen.getByText("Tu carrito sigue igual.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Volver al carrito" }).getAttribute("href")).toBe("/carrito");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("una compra ajena o inexistente es 404", async () => {
    vi.mocked(getPurchase).mockRejectedValue(
      new MarketplaceAccountError({ status: 404, code: "not_found", message: "No encontrado." }),
    );

    await expect(CheckoutResult({ code: "PV-00000A" })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
