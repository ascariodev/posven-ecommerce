import type { StoreOrder } from "@/lib/marketplace/schemas";
import { IN_STORE_FIRST_STEP_TEXT, IN_STORE_READY_HINT, ORDER_STEP_HINT, ORDER_STEP_TEXT } from "./labels";
import { paysAtPickup } from "./payment";

export type OrderStepState = "done" | "now" | "next";

export type OrderStep = { label: string; state: OrderStepState; at: string | null; hint: string | null };

export type TrackedOrder = Pick<StoreOrder, "status" | "fulfillment" | "timeline" | "payment">;

// La API no distingue "preparado" de "aceptado": ese paso es el actual mientras el pedido está aceptado.
const CURRENT_STEP: Record<Exclude<StoreOrder["status"], "cancelled">, number> = {
  pending_payment: 0,
  accepted: 1,
  ready_for_pickup: 2,
  out_for_delivery: 2,
  delivered: 3,
};

function stepHint(fulfillment: StoreOrder["fulfillment"], index: number, inStore: boolean): string {
  return inStore && fulfillment === "pickup" && index === 2 ? IN_STORE_READY_HINT : ORDER_STEP_HINT[fulfillment][index];
}

export function orderSteps(order: TrackedOrder): OrderStep[] | null {
  if (order.status === "cancelled") return null;
  const current = CURRENT_STEP[order.status];
  const finished = order.status === "delivered";
  const { timeline } = order;
  const isPickup = order.fulfillment === "pickup";
  const dates = [timeline.paid_at, null, isPickup ? timeline.ready_at : timeline.dispatched_at, timeline.delivered_at];
  const inStore = paysAtPickup(order);
  return ORDER_STEP_TEXT[order.fulfillment].map((baseLabel, index) => {
    const label = inStore && index === 0 ? IN_STORE_FIRST_STEP_TEXT : baseLabel;
    const state: OrderStepState = finished || index < current ? "done" : index === current ? "now" : "next";
    return { label, state, at: dates[index], hint: state === "now" && index < 3 ? stepHint(order.fulfillment, index, inStore) : null };
  });
}
