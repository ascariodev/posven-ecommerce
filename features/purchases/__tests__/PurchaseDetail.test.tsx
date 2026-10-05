import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PurchaseDetail } from "@/features/purchases/components/PurchaseDetail";
import { order, orderLine, purchase } from "@/features/purchases/__tests__/fixtures/testPurchase";

afterEach(() => {
  cleanup();
});

describe("PurchaseDetail", () => {
  it("destaca el código de retiro y marca la línea faltante reembolsada, sin calcular montos", () => {
    render(
      <PurchaseDetail
        purchase={purchase({
          orders: [
            order({
              lines: [orderLine(), orderLine({ product: { slug: "alcohol", name: "Alcohol isopropílico", image_url: null, category: null }, accepted_quantity: 0, missing: true, line_usd: "1.60" })],
              refunded_usd: "1.65",
              refunded_ves: "60.20",
            }),
          ],
        })}
      />,
    );

    expect(screen.getByText("Código de retiro")).toBeTruthy();
    expect(screen.getByText("482913")).toBeTruthy();
    const lines = within(screen.getByRole("list", { name: "Productos de Farmacia Central" })).getAllByRole("listitem");
    expect(lines[0].textContent).not.toContain("Faltante");
    expect(lines[1].textContent).toContain("Faltante · reembolsado");
    // 1,65 ≠ 1,60 y 6,70 ≠ 5,10 + 1,60: son las cadenas de la API.
    expect(screen.getByText("$ 1,65 · Bs 60,20")).toBeTruthy();
    expect(screen.getAllByText("$ 6,70 · Bs 244,55")).toHaveLength(2);
    expect(screen.getByText("Bs 244,60")).toBeTruthy();
    expect(screen.getByText("Listo para retirar", { selector: "[data-slot=badge]" })).toBeTruthy();
    expect(screen.getByText("30/09/2026 14:20")).toBeTruthy();
    expect(within(screen.getByRole("list", { name: "Estado del pedido" })).getAllByRole("listitem")).toHaveLength(4);
  });

  it("una entrega muestra la dirección y el envío, sin código de retiro", () => {
    render(
      <PurchaseDetail
        purchase={purchase({
          orders: [
            order({
              status: "out_for_delivery",
              fulfillment: "delivery",
              pickup_code: null,
              delivery_fee_usd: "1.50",
              delivery_fee_ves: "54.75",
              address: {
                label: "Oficina",
                recipient_name: "Comprador",
                phone: "+584141234569",
                city: { slug: "valencia", name: "Valencia" },
                line: "Av. Bolívar Norte, torre Delta",
                reference: "Frente a la plaza",
              },
            }),
          ],
        })}
      />,
    );

    expect(screen.queryByText("Código de retiro")).toBeNull();
    expect(screen.getByText("Se entrega en Oficina")).toBeTruthy();
    expect(screen.getByText("Av. Bolívar Norte, torre Delta, Valencia")).toBeTruthy();
    expect(screen.getByText("$ 1,50 · Bs 54,75")).toBeTruthy();
    expect(screen.queryByText("Reembolsado")).toBeNull();
  });

  it("con la compra sin pagar no muestra el estado del pedido", () => {
    render(
      <PurchaseDetail
        purchase={purchase({ status: "pending_payment", paid_at: null, orders: [order({ status: "accepted", pickup_code: null })] })}
      />,
    );

    expect(screen.getByText("Pago pendiente")).toBeTruthy();
    expect(screen.queryByText("Aceptado")).toBeNull();
    expect(screen.queryByRole("list", { name: "Estado del pedido" })).toBeNull();
  });
});
