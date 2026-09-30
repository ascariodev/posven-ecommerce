import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getCart, mergeCart, quoteGuestCart } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { AccountContext } from "@/lib/marketplace/params";
import type { Cart } from "@/lib/marketplace/schemas";
import { accountContext } from "@/features/account/session";
import { CART_COOKIE, cartCookieOptions, parseCartCookie, readGuestCart } from "./cookie";

// Fuera de "use server" a propósito: `mergeGuestCart` recibe un AccountContext (token e IP) que no
// puede llegar de un formulario.

function isUnauthenticated(error: unknown): boolean {
  return error instanceof MarketplaceAccountError && error.code === "unauthenticated";
}

// El carrito del comprador con sesión, una sola vez por petición: lo usan `/carrito` y el contador
// de la cabecera. Sin argumentos a propósito: `cache` compara por identidad. Sin sesión, `null`.
export const getSessionCart = cache(async (): Promise<Cart | null> => {
  const ctx = await accountContext();
  return ctx.session === null ? null : getCart(ctx);
});

// El carrito de la petición: con sesión, el del servidor (un 401 sigue como invitado, spec §6); sin
// sesión, la cotización de `mp_cart`; sin entradas, `null` sin llamar a la API.
export const getCurrentCart = cache(async (): Promise<Cart | null> => {
  const ctx = await accountContext();
  if (ctx.session !== null) {
    try {
      const cart = await getSessionCart();
      if (cart !== null) return cart;
    } catch (error) {
      if (!isUnauthenticated(error)) throw error;
    }
  }
  const items = await readGuestCart();
  if (items.length === 0) return null;
  return quoteGuestCart({ ...ctx, session: null }, items);
});

// Fusión al entrar o registrarse (RN-CART-02): sólo desde una Server Action (borra `mp_cart`). Con la
// API caída o un 429 (pasajeros) conserva la cookie para el próximo login; ante otro error de la API
// (permanente) la borra. Ningún error de la API interrumpe el acceso; uno de programación se relanza.
export async function mergeGuestCart(ctx: AccountContext): Promise<void> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (raw === undefined) return;
  const items = parseCartCookie(raw);
  if (items.length > 0) {
    try {
      await mergeCart(ctx, items);
    } catch (error) {
      if (error instanceof MarketplaceUnavailableError) return;
      if (!(error instanceof MarketplaceAccountError)) throw error;
      if (error.status === 429) return;
    }
  }
  store.delete({ name: CART_COOKIE, path: cartCookieOptions().path });
}
