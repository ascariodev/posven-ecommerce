import type { PurchasePage } from "@/lib/marketplace/schemas";

// `?pagina` de /cuenta/compras (RN-PURCHASES-01): un valor inválido es la página 1.
export function readPurchasesPage(raw: string | string[] | undefined): number {
  return typeof raw === "string" && /^[1-9]\d{0,5}$/.test(raw) ? Number(raw) : 1;
}

// Una página vacía después de la 1 está fuera de rango (404); la 1 vacía es "sin compras".
export function isPageOutOfRange(page: PurchasePage): boolean {
  return page.data.length === 0 && page.meta.page > 1;
}
