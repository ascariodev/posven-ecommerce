"use server";

import { redirect } from "next/navigation";
import { startCheckout } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { checkoutInputSchema, type CheckoutInput, type CheckoutStart } from "@/lib/marketplace/schemas";
import { withSession } from "@/features/account/session";
import { cartEnabled } from "@/features/cart/lib/flag";
import { INITIAL_CHECKOUT_STATE, PAY_FAILED, type CheckoutState } from "../lib/checkoutState";

// Todo export de este archivo es un endpoint público: sólo la acción del formulario de pago.

const CHECKOUT_PATH = "/checkout";

function readInput(formData: FormData): CheckoutInput | null {
  const stores = formData
    .getAll("store_slug")
    .filter((value): value is string => typeof value === "string")
    .map((store_slug) => ({ store_slug, fulfillment: formData.get(`f-${store_slug}`) }));
  const rawAddress = formData.get("address_id");
  const address_id = typeof rawAddress === "string" && /^[1-9]\d{0,8}$/.test(rawAddress) ? Number(rawAddress) : null;
  const parsed = checkoutInputSchema.safeParse({
    stores,
    address_id,
    quote_hash: formData.get("quote_hash"),
    idempotency_key: formData.get("idempotency_key"),
  });
  return parsed.success ? parsed.data : null;
}

function stateFrom(error: unknown): CheckoutState {
  if (error instanceof MarketplaceUnavailableError) return { status: "error", message: PAY_FAILED };
  if (!(error instanceof MarketplaceAccountError)) throw error;
  switch (error.code) {
    // Un 401 lo resuelve withSession: borra la sesión y lleva a entrar.
    case "unauthenticated":
      throw error;
    case "quote_changed":
      return error.quote === null
        ? { status: "error", message: error.message }
        : { status: "quote_changed", message: error.message, quote: error.quote };
    case "email_unverified":
      return { status: "email_unverified", message: error.message };
    case "cart_empty":
      return { status: "cart_empty", message: error.message };
    case "too_many_attempts":
      return error.retryAfter === null
        ? { status: "error", message: error.message }
        : { status: "error", message: `Demasiados intentos. Prueba de nuevo en ${error.retryAfter} segundos.` };
    default:
      return { status: "error", message: error.message };
  }
}

export async function payCheckout(prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  void prev;
  if (!cartEnabled()) return INITIAL_CHECKOUT_STATE;
  const input = readInput(formData);
  if (input === null) return { status: "error", message: PAY_FAILED };

  const result = await withSession(CHECKOUT_PATH, async (ctx): Promise<CheckoutStart | CheckoutState> => {
    try {
      return await startCheckout(ctx, input);
    } catch (error) {
      return stateFrom(error);
    }
  });
  if ("status" in result) return result;
  // La pasarela devuelve una redirección o instrucciones, una sola (enmienda F).
  if (result.payment.redirect_url !== null) redirect(result.payment.redirect_url);
  return {
    status: "instructions",
    purchaseCode: result.purchase_code,
    instructions: result.payment.instructions ?? "",
  };
}
