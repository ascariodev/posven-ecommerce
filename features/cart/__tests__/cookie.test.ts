import { describe, expect, it } from "vitest";
import type { CartItem } from "@/lib/marketplace/schemas";
import { cartCookieOptions, parseCartCookie, serializeCart } from "@/features/cart/server/cookie";

const line: CartItem = {
  store_slug: "farmacia-central-valencia",
  product_slug: "acetaminofen-500-mg-20-tabletas",
  quantity: 2,
};

function lines(count: number, slugLength = 20): CartItem[] {
  return Array.from({ length: count }, (_, index) => ({
    store_slug: `tienda-${index}`.padEnd(slugLength, "x"),
    product_slug: `producto-${index}`.padEnd(slugLength, "x"),
    quantity: 99,
  }));
}

describe("mp_cart (RN-CART-01)", () => {
  it("opciones de la cookie: httpOnly, lax, raíz y 30 días", () => {
    expect(cartCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 2592000,
    });
  });

  it("ida y vuelta de serializeCart y parseCartCookie", () => {
    const value = serializeCart([line]);
    expect(value).not.toBeNull();
    expect(parseCartCookie(value ?? undefined)).toEqual([line]);
  });

  it.each([
    ["sin cookie", undefined],
    ["JSON inválido", "no-es-json"],
    ["no es arreglo", JSON.stringify(line)],
    ["más de 20 entradas", JSON.stringify(lines(21))],
    ["cantidad 0", JSON.stringify([{ ...line, quantity: 0 }])],
    ["cantidad 100", JSON.stringify([{ ...line, quantity: 100 }])],
    ["claves de más", JSON.stringify([{ ...line, price_usd: "1.00" }])],
    ["entradas repetidas", JSON.stringify([line, line])],
  ])("%s da un carrito vacío", (_name, value) => {
    expect(parseCartCookie(value)).toEqual([]);
  });

  it("20 líneas con slugs cortos caben", () => {
    expect(serializeCart(lines(20))).not.toBeNull();
  });

  it("20 líneas con slugs de 120 caracteres pasan del tope codificado y dan null", () => {
    expect(serializeCart(lines(20, 120))).toBeNull();
  });
});
