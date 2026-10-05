import { describe, expect, it } from "vitest";
import { order, purchase } from "@/features/purchases/__tests__/fixtures/testPurchase";
import { chargeText, purchaseProgress, purchaseStatusText } from "@/features/purchases/lib/labels";
import { formatUsd, formatVes } from "@/lib/format";

describe("chargeText", () => {
  it("formatea en bolívares lo cobrado en VES", () => {
    expect(chargeText({ currency: "VES", amount: "1234.50" })).toBe(formatVes("1234.50"));
  });

  it("formatea en dólares lo cobrado en USD", () => {
    expect(chargeText({ currency: "USD", amount: "12.00" })).toBe(formatUsd("12.00"));
  });
});

describe("purchaseProgress", () => {
  const paid = (...overrides: Parameters<typeof order>[0][]) => purchase({ orders: overrides.map((o) => order(o)) });

  it.each([
    ["aceptado", paid({ status: "accepted" }), "Preparando", "warning"],
    ["listo para retirar", paid({ status: "accepted" }, { status: "ready_for_pickup" }), "Listo para retirar", "success"],
    ["en camino", paid({ status: "out_for_delivery" }), "En camino", "warning"],
    ["entregada con un pedido cancelado", paid({ status: "delivered" }, { status: "cancelled" }), "Entregada", "success"],
    ["todos cancelados", paid({ status: "cancelled" }), "Cancelada", "destructive"],
    ["pago pendiente", purchase({ status: "pending_payment" }), "Pago pendiente", "warning"],
    ["pago fallido", purchase({ status: "failed" }), "Pago fallido", "destructive"],
  ] as const)("%s", (_name, input, text, variant) => {
    expect(purchaseProgress(input)).toEqual({ text, variant });
  });
});

describe("Cancelada", () => {
  it.each([
    ["todos los pedidos cancelados", purchase({ orders: [order({ status: "cancelled" })] }), true],
    ["un pedido activo", purchase({ orders: [order({ status: "cancelled" }), order({ status: "accepted" })] }), false],
    ["sin pedidos", purchase({ orders: [] }), false],
    ["sin pagar", purchase({ status: "pending_payment", orders: [order({ status: "cancelled" })] }), false],
  ] as const)("historial y cuenta coinciden: %s", (_name, input, cancelled) => {
    expect(purchaseStatusText(input) === "Cancelada").toBe(cancelled);
    expect(purchaseProgress(input).text === "Cancelada").toBe(cancelled);
  });
});
