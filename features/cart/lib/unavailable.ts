import type { UnavailableReason } from "@/lib/marketplace/schemas";

export const UNAVAILABLE_TEXT: Record<UnavailableReason, string> = {
  out_of_stock: "Sin existencias",
  store_not_selling: "La tienda ya no vende en línea",
  offer_gone: "Ya no se ofrece en esta tienda",
  restricted: "Se vende sólo en tienda",
};
