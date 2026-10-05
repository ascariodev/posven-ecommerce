import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OrderTracker } from "@/features/purchases/components/OrderTracker";
import { orderSteps } from "@/features/purchases/lib/orderSteps";
import { order } from "@/features/purchases/__tests__/fixtures/testPurchase";

afterEach(() => {
  cleanup();
});

const states = (value: Parameters<typeof orderSteps>[0]) => orderSteps(value)?.map((step) => `${step.label}:${step.state}`);

describe("OrderTracker", () => {
  it("un retiro listo marca Pagado y Preparado hechos y Listo para retirar como actual", () => {
    expect(states(order())).toEqual(["Pagado:done", "Preparado:done", "Listo para retirar:now", "Entregado:next"]);
    render(<OrderTracker order={order()} />);
    const items = within(screen.getByRole("list", { name: "Estado del pedido" })).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[2].getAttribute("aria-current")).toBe("step");
    expect(items[2].textContent).toContain("30/09/2026 14:20");
    expect(items[2].textContent).toContain("Muestra tu código de retiro en caja");
  });

  it("una entrega aceptada está en Preparando y en camino pasa a En camino", () => {
    const timeline = { paid_at: "2026-09-30T18:00:05Z", ready_at: null, dispatched_at: null, delivered_at: null, cancelled_at: null };
    expect(states(order({ fulfillment: "delivery", status: "accepted", timeline }))).toEqual(["Pagado:done", "Preparando:now", "En camino:next", "Entregado:next"]);
    expect(states(order({ fulfillment: "delivery", status: "out_for_delivery", timeline }))).toEqual(["Pagado:done", "Preparando:done", "En camino:now", "Entregado:next"]);
  });

  it("un pedido entregado deja todos los pasos hechos, sin paso actual", () => {
    const delivered = order({ status: "delivered", timeline: { ...order().timeline, delivered_at: "2026-09-30T19:00:00Z" } });
    expect(states(delivered)).toEqual(["Pagado:done", "Preparado:done", "Listo para retirar:done", "Entregado:done"]);
    render(<OrderTracker order={delivered} />);
    expect(screen.getAllByRole("listitem").some((item) => item.hasAttribute("aria-current"))).toBe(false);
  });

  it("cada paso dice por texto si está completado o pendiente, y el actual lo marca aria-current", () => {
    render(<OrderTracker order={order()} />);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText(", completado").className).toContain("sr-only");
    expect(within(items[3]).getByText(", pendiente").className).toContain("sr-only");
    expect(items[2].getAttribute("aria-current")).toBe("step");
    expect(items[2].textContent).not.toMatch(/completado|pendiente/);
  });

  it("un pedido con el pago pendiente tiene Pagado como paso actual y los demás pendientes", () => {
    const pending = order({ status: "pending_payment", timeline: { paid_at: null, ready_at: null, dispatched_at: null, delivered_at: null, cancelled_at: null } });
    expect(states(pending)).toEqual(["Pagado:now", "Preparado:next", "Listo para retirar:next", "Entregado:next"]);
    render(<OrderTracker order={pending} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0].getAttribute("aria-current")).toBe("step");
    expect(items[0].textContent).toContain("Esperando la confirmación del pago");
    expect(items.slice(1).every((item) => item.textContent?.includes("pendiente"))).toBe(true);
  });

  it("un pedido cancelado se muestra aparte, sin pasos", () => {
    render(<OrderTracker order={order({ status: "cancelled", timeline: { ...order().timeline, cancelled_at: "2026-09-30T18:30:00Z" } })} />);
    expect(screen.getByText("Pedido cancelado")).toBeTruthy();
    expect(screen.getByText("30/09/2026 14:30")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("un pedido cancelado muestra cuándo se pagó", () => {
    render(<OrderTracker order={order({ status: "cancelled", timeline: { ...order().timeline, cancelled_at: "2026-09-30T18:30:00Z" } })} />);
    expect(screen.getByText("Pagado el 30/09/2026 14:00")).toBeTruthy();
  });

  it("una entrega no fecha Preparando con ready_at, que es de retiros, y fecha En camino con dispatched_at", () => {
    const delivery = order({ fulfillment: "delivery", status: "out_for_delivery", timeline: { ...order().timeline, dispatched_at: "2026-09-30T18:40:00Z" } });
    render(<OrderTracker order={delivery} />);
    const items = screen.getAllByRole("listitem");
    expect(items[1].textContent).not.toContain("30/09/2026 14:20");
    expect(items[2].textContent).toContain("30/09/2026 14:40");
  });
});
