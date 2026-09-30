import "server-only";
import { getCart, listAddresses, quoteCheckout } from "@/lib/marketplace/client";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import type { AccountContext } from "@/lib/marketplace/params";
import type { Address, CartStore, CheckoutQuoteInput, Fulfillment, Quote } from "@/lib/marketplace/schemas";
import type { CheckoutParams } from "./params";

// Lectura de /checkout (spec cuentas-y-compras §5.3): el carrito del comprador, sus direcciones y
// la Quote de lo elegido en la URL (`params.ts`).

export type CheckoutData =
  | { kind: "empty" }
  | { kind: "ready"; stores: CartStore[]; addresses: Address[]; addressId: number | null; quote: Quote };

function chooseAddress(addresses: Address[], requested: number | null): Address | null {
  return (
    addresses.find((address) => address.id === requested) ??
    addresses.find((address) => address.is_default) ??
    addresses[0] ??
    null
  );
}

function isAccountError(error: unknown, code: string): boolean {
  return error instanceof MarketplaceAccountError && error.code === code;
}

export async function loadCheckout(ctx: AccountContext, params: CheckoutParams): Promise<CheckoutData> {
  const [cart, addresses] = await Promise.all([getCart(ctx), listAddresses(ctx)]);
  const stores = cart.stores.filter((store) => store.lines.some((line) => line.status === "ok"));
  if (stores.length === 0) return { kind: "empty" };

  const address = chooseAddress(addresses, params.addressId);
  const input = (withAddress: Address | null): CheckoutQuoteInput => ({
    stores: stores.map((store) => ({
      store_slug: store.store.slug,
      fulfillment: (withAddress !== null && params.delivery.includes(store.store.slug) ? "delivery" : "pickup") as Fulfillment,
    })),
    address_id: withAddress?.id ?? null,
  });

  try {
    return { kind: "ready", stores, addresses, addressId: address?.id ?? null, quote: await quoteCheckout(ctx, input(address)) };
  } catch (error) {
    if (isAccountError(error, "cart_empty")) return { kind: "empty" };
    if (!isAccountError(error, "validation_failed")) throw error;
  }
  // La dirección dejó de ser del comprador entre la lectura y la cotización: todo a retiro.
  try {
    return { kind: "ready", stores, addresses, addressId: null, quote: await quoteCheckout(ctx, input(null)) };
  } catch (error) {
    if (isAccountError(error, "cart_empty")) return { kind: "empty" };
    throw error;
  }
}
