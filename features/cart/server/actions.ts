"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCart, setCartItem } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import {
  CART_MAX_LINES as MAX_LINES,
  CART_MAX_QUANTITY as MAX_QUANTITY,
  CART_SLUG_MAX_LENGTH as MAX_SLUG_LENGTH,
  type Cart,
} from "@/lib/marketplace/schemas";
import { accountContext, SESSION_COOKIE, sessionCookieOptions } from "@/features/account/session";
import { INITIAL_ADD_TO_CART_STATE, type AddToCartState } from "../lib/addToCartState";
import { readGuestCart, serializeCart, writeGuestCart } from "./cookie";
import { cartEnabled } from "../lib/flag";

// Todo export de este archivo es un endpoint público: sólo las tres acciones de formulario. La
// fusión al entrar vive en server.ts.

const CART_FULL = "Tu carrito admite hasta 20 productos.";
const AT_MAX_QUANTITY = "Ya tienes 99 unidades de este producto.";
const ADD_FAILED = "No pudimos agregar el producto. Intenta de nuevo.";

type LineRef = { store_slug: string; product_slug: string };

function slug(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" && value.length > 0 && value.length <= MAX_SLUG_LENGTH ? value : null;
}

function lineRef(formData: FormData): LineRef | null {
  const store_slug = slug(formData, "store_slug");
  const product_slug = slug(formData, "product_slug");
  return store_slug === null || product_slug === null ? null : { store_slug, product_slug };
}

function sameLine(a: LineRef, b: LineRef): boolean {
  return a.store_slug === b.store_slug && a.product_slug === b.product_slug;
}

function quantityIn(cart: Cart, ref: LineRef): number {
  const store = cart.stores.find((entry) => entry.store.slug === ref.store_slug);
  return store?.lines.find((line) => line.product.slug === ref.product_slug)?.quantity ?? 0;
}

function isUnauthenticated(error: unknown): boolean {
  return error instanceof MarketplaceAccountError && error.code === "unauthenticated";
}

// Un 401 con `unauthenticated` borra la sesión y la operación sigue como invitado (spec §6).
async function dropSession(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: sessionCookieOptions().path });
}

function added(): AddToCartState {
  refresh();
  return { status: "added", message: null };
}

function failed(message: string): AddToCartState {
  return { status: "error", message };
}

// El mensaje de la API puede no traer los segundos: se arman con `retryAfter` (spec §6).
function accountFailure(error: MarketplaceAccountError): AddToCartState {
  if (error.code === "too_many_attempts" && error.retryAfter !== null) {
    return failed(`Demasiados intentos. Prueba de nuevo en ${error.retryAfter} segundos.`);
  }
  return failed(error.message);
}

async function addAsGuest(ref: LineRef): Promise<AddToCartState> {
  const items = await readGuestCart();
  const existing = items.find((item) => sameLine(item, ref));
  if (existing !== undefined && existing.quantity >= MAX_QUANTITY) return failed(AT_MAX_QUANTITY);
  if (existing === undefined && items.length >= MAX_LINES) return failed(CART_FULL);
  const next =
    existing === undefined
      ? [...items, { ...ref, quantity: 1 }]
      : items.map((item) => (sameLine(item, ref) ? { ...item, quantity: item.quantity + 1 } : item));
  // Se mide con todas las líneas en 99: así ningún cambio de cantidad posterior pasa del tope.
  if (serializeCart(next.map((item) => ({ ...item, quantity: MAX_QUANTITY }))) === null) return failed(CART_FULL);
  await writeGuestCart(next);
  return added();
}

export async function addToCart(prev: AddToCartState, formData: FormData): Promise<AddToCartState> {
  if (!cartEnabled()) return INITIAL_ADD_TO_CART_STATE;
  const ref = lineRef(formData);
  if (ref === null) return failed(ADD_FAILED);
  const ctx = await accountContext();
  if (ctx.session !== null) {
    try {
      const current = quantityIn(await getCart(ctx), ref);
      if (current >= MAX_QUANTITY) return failed(AT_MAX_QUANTITY);
      // La API topa la cantidad al stock publicado (enmienda G): si no subió, no se agregó.
      const saved = quantityIn(await setCartItem(ctx, { ...ref, quantity: current + 1 }), ref);
      if (saved <= current) {
        refresh();
        return failed(`Sólo hay ${saved} ${saved === 1 ? "unidad disponible" : "unidades disponibles"}.`);
      }
      return added();
    } catch (error) {
      if (error instanceof MarketplaceUnavailableError) return failed(ADD_FAILED);
      if (!(error instanceof MarketplaceAccountError)) throw error;
      if (!isUnauthenticated(error)) return accountFailure(error);
      await dropSession();
    }
  }
  return addAsGuest(ref);
}

async function writeQuantity(formData: FormData, quantity: number): Promise<void> {
  if (!cartEnabled()) return;
  const ref = lineRef(formData);
  if (ref === null || !Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) return;
  const ctx = await accountContext();
  if (ctx.session !== null) {
    try {
      await setCartItem(ctx, { ...ref, quantity });
      refresh();
      return;
    } catch (error) {
      // La línea dejó de poder comprarse: el siguiente render la pinta `unavailable`. La API caída
      // sube a error.tsx.
      if (error instanceof MarketplaceAccountError && ["not_orderable", "product_restricted"].includes(error.code)) {
        refresh();
        return;
      }
      if (!isUnauthenticated(error)) throw error;
      await dropSession();
    }
  }
  const items = await readGuestCart();
  const next =
    quantity === 0
      ? items.filter((item) => !sameLine(item, ref))
      : items.map((item) => (sameLine(item, ref) ? { ...item, quantity } : item));
  await writeGuestCart(next);
  refresh();
}

export async function setQuantity(formData: FormData): Promise<void> {
  const value = formData.get("quantity");
  const quantity = typeof value === "string" && /^\d{1,2}$/.test(value) ? Number(value) : Number.NaN;
  if (quantity >= 1) await writeQuantity(formData, quantity);
}

export async function removeLine(formData: FormData): Promise<void> {
  await writeQuantity(formData, 0);
}
