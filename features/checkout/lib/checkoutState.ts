import type { Quote } from "@/lib/marketplace/schemas";

// Estado del formulario de pago. Vive fuera de actions.ts: un archivo "use server" sólo exporta
// funciones async.
export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "quote_changed"; message: string; quote: Quote }
  | { status: "email_unverified"; message: string }
  | { status: "billing_incomplete"; message: string }
  | { status: "cart_empty"; message: string }
  | { status: "instructions"; purchaseCode: string; instructions: string };

export const INITIAL_CHECKOUT_STATE: CheckoutState = { status: "idle" };

export const PAY_FAILED = "No pudimos iniciar el pago. Intenta de nuevo.";
