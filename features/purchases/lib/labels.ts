import { formatUsd, formatVes } from "@/lib/format";
import type { Charge, Fulfillment, Purchase, PurchaseStatus, StoreOrderStatus } from "@/lib/marketplace/schemas";

export const PURCHASE_STATUS_TEXT: Record<PurchaseStatus, string> = {
  pending_payment: "Pago pendiente",
  paid: "Pagada",
  expired: "Vencida",
  failed: "Pago fallido",
};

export function purchaseStatusText(purchase: Purchase): string {
  const allCancelled = purchase.orders.length > 0 && purchase.orders.every((order) => order.status === "cancelled");
  return purchase.status === "paid" && allCancelled ? "Cancelada" : PURCHASE_STATUS_TEXT[purchase.status];
}

export const ORDER_STATUS_TEXT: Record<StoreOrderStatus, string> = {
  pending_payment: "Pago pendiente",
  accepted: "Aceptado",
  ready_for_pickup: "Listo para retirar",
  out_for_delivery: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export type PurchaseProgress = { text: string; variant: "warning" | "success" | "destructive" };

// Estado de una compra para el comprador: la pagada se lee por el avance de sus pedidos y el
// resto por el estado del pago.
export function purchaseProgress(purchase: Purchase): PurchaseProgress {
  if (purchase.status === "expired" || purchase.status === "failed") {
    return { text: PURCHASE_STATUS_TEXT[purchase.status], variant: "destructive" };
  }
  if (purchase.status === "pending_payment") return { text: PURCHASE_STATUS_TEXT.pending_payment, variant: "warning" };
  const statuses = purchase.orders.map((order) => order.status);
  if (statuses.length > 0 && statuses.every((status) => status === "cancelled")) {
    return { text: "Cancelada", variant: "destructive" };
  }
  const active = statuses.filter((status) => status !== "cancelled");
  if (active.length > 0 && active.every((status) => status === "delivered")) return { text: "Entregada", variant: "success" };
  if (active.includes("ready_for_pickup")) return { text: ORDER_STATUS_TEXT.ready_for_pickup, variant: "success" };
  if (active.includes("out_for_delivery")) return { text: ORDER_STATUS_TEXT.out_for_delivery, variant: "warning" };
  return { text: "Preparando", variant: "warning" };
}

export const FULFILLMENT_TEXT: Record<Fulfillment, string> = {
  pickup: "Retiro en tienda",
  delivery: "Entrega a domicilio",
};

const DATE_PARTS = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// "30/09/2026 14:00" en la hora de Caracas, armado por partes para no depender de los separadores
// del motor de Intl.
export function formatDateTime(iso: string): string {
  const parts = Object.fromEntries(DATE_PARTS.formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

export function chargeText(charge: Charge): string {
  return charge.currency === "VES" ? formatVes(charge.amount) : formatUsd(charge.amount);
}

export function storeCountText(count: number): string {
  return count === 1 ? "1 tienda" : `${count} tiendas`;
}

export const ORDER_STEP_TEXT: Record<Fulfillment, readonly [string, string, string, string]> = {
  pickup: ["Pagado", "Preparado", "Listo para retirar", "Entregado"],
  delivery: ["Pagado", "Preparando", "En camino", "Entregado"],
};

export const ORDER_STEP_STATE_TEXT = { done: "completado", next: "pendiente" } as const;

export const ORDER_STEP_HINT: Record<Fulfillment, readonly [string, string, string]> = {
  pickup: ["Esperando la confirmación del pago", "La tienda está reuniendo tus productos", "Muestra tu código de retiro en caja"],
  delivery: ["Esperando la confirmación del pago", "La tienda está reuniendo tus productos", "Tu pedido va hacia tu dirección"],
};
