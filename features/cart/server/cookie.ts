import "server-only";
import { cookies } from "next/headers";
import { cartItemsSchema, type CartItem } from "@/lib/marketplace/schemas";

// Carrito de invitado (spec cuentas-y-compras §2 y §5.2, RN-CART-01): JSON de
// [{ store_slug, product_slug, quantity }] sin precios, hasta 20 líneas y cantidades de 1 a 99.
export const CART_COOKIE = "mp_cart";

// Next codifica el valor con encodeURIComponent: por encima de ~4 KB el navegador descarta la cookie
// en silencio, así que se topa el valor codificado.
const MAX_ENCODED_BYTES = 3800;

export function cartCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 2592000,
  };
}

export function parseCartCookie(value: string | undefined): CartItem[] {
  if (value === undefined) return [];
  let json: unknown;
  try {
    json = JSON.parse(value);
  } catch {
    return [];
  }
  const parsed = cartItemsSchema.safeParse(json);
  return parsed.success ? parsed.data : [];
}

// `null` si el valor codificado pasaría del tope: quien escribe responde "carrito lleno".
export function serializeCart(items: CartItem[]): string | null {
  const value = JSON.stringify(items);
  return encodeURIComponent(value).length > MAX_ENCODED_BYTES ? null : value;
}

export async function readGuestCart(): Promise<CartItem[]> {
  return parseCartCookie((await cookies()).get(CART_COOKIE)?.value);
}

// Sólo desde una Server Action: un Server Component no puede escribir cookies. Una cookie inválida
// se reemplaza aquí, en la siguiente escritura.
export async function writeGuestCart(items: CartItem[]): Promise<boolean> {
  const store = await cookies();
  if (items.length === 0) {
    store.delete({ name: CART_COOKIE, path: cartCookieOptions().path });
    return true;
  }
  const value = serializeCart(items);
  if (value === null) return false;
  store.set(CART_COOKIE, value, cartCookieOptions());
  return true;
}
