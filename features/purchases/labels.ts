import type { Fulfillment, PurchaseStatus, StoreOrderStatus } from "@/lib/marketplace/schemas";

export const PURCHASE_STATUS_TEXT: Record<PurchaseStatus, string> = {
  pending_payment: "Pago pendiente",
  paid: "Pagada",
  expired: "Vencida",
  failed: "Pago fallido",
};

export const ORDER_STATUS_TEXT: Record<StoreOrderStatus, string> = {
  accepted: "Aceptado",
  ready_for_pickup: "Listo para retirar",
  out_for_delivery: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

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

export function storeCountText(count: number): string {
  return count === 1 ? "1 tienda" : `${count} tiendas`;
}
