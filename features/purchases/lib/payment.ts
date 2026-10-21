import type { Money, Purchase, StoreOrder } from "@/lib/marketplace/schemas";

// Una compra sin pedidos online nace pagada con cobro 0 (spec cuentas-y-compras §10.1): no hubo pago.
// La ausencia de `payment` es `online`; el cobro 0 se reconoce por la cadena, sin convertirla.
export function chargedOnline(purchase: Purchase): boolean {
  return purchase.orders.some((order) => order.payment !== "in_store") && !/^0+(\.0+)?$/.test(purchase.charge.amount);
}

export function paysAtPickup(order: Pick<StoreOrder, "payment">): boolean {
  return order.payment === "in_store";
}

function sumMoney(values: Money[]): Money {
  const cents = values.reduce((total, value) => total + BigInt(value.replace(".", "")), BigInt(0));
  const digits = cents.toString().padStart(3, "0");
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

// La API no manda el monto a pagar al retirar (spec §10.2): es la suma de las líneas no faltantes,
// en céntimos enteros como `StoreOrder::payableAtPickup()` de posveapi.
export function payableAtPickup(order: Pick<StoreOrder, "lines">): { usd: Money; ves: Money } {
  const remaining = order.lines.filter((line) => !line.missing);
  return { usd: sumMoney(remaining.map((line) => line.line_usd)), ves: sumMoney(remaining.map((line) => line.line_ves)) };
}
