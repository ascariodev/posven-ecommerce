import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCart, setCartItem } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { Cart, CartItem } from "@/lib/marketplace/schemas";
import { addToCart, removeLine, setQuantity } from "@/features/cart/server/actions";
import { INITIAL_ADD_TO_CART_STATE } from "@/features/cart/lib/addToCartState";

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }));
const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers(),
}));

vi.mock("next/cache", () => ({ refresh }));

vi.mock("@/lib/marketplace/client", () => ({
  getCart: vi.fn(),
  setCartItem: vi.fn(),
  getMe: vi.fn(),
}));

const STORE = "farmacia-central-valencia";
const PRODUCT = "acetaminofen-500-mg-20-tabletas";
const ref = { store_slug: STORE, product_slug: PRODUCT };

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) formData.set(name, value);
  return formData;
}

function withCookies(values: { session?: string; cart?: CartItem[] }): void {
  cookieStore.get.mockImplementation((name: string) => {
    if (name === "mp_session" && values.session !== undefined) return { name, value: values.session };
    if (name === "mp_cart" && values.cart !== undefined) return { name, value: JSON.stringify(values.cart) };
    return undefined;
  });
}

function writtenCart(): CartItem[] | null {
  const call = cookieStore.set.mock.calls.find(([name]) => name === "mp_cart");
  return call === undefined ? null : (JSON.parse(call[1] as string) as CartItem[]);
}

function deleted(name: string): boolean {
  return cookieStore.delete.mock.calls.some(([arg]) => (arg as { name: string }).name === name);
}

function cartWith(quantity: number): Cart {
  return {
    stores: [
      {
        store: {
          slug: STORE,
          name: "Farmacia Central",
          logo_url: null,
          address: "Av. Bolívar Norte",
          city: { slug: "valencia", name: "Valencia" },
          latitude: 10.18,
          longitude: -68,
          phone: null,
          whatsapp: null,
          is_premium: false,
          accepts_orders: true,
        },
        is_open: true,
        accepts_orders: true,
        offers_delivery: false,
        lines: [
          {
            product: { slug: PRODUCT, name: "Acetaminofén", image_url: null, category: null },
            quantity,
            price_usd: "2.50",
            price_ves: "91.25",
            line_usd: "2.50",
            line_ves: "91.25",
            availability: "available",
            status: "ok",
            unavailable_reason: null,
          },
        ],
        subtotal_usd: "2.50",
        subtotal_ves: "91.25",
      },
    ],
    total_usd: "2.50",
    total_ves: "91.25",
    line_count: 1,
    rate: { usd_ves: "36.50", valid_on: "2026-09-26" },
  };
}

const unauthenticated = () => new MarketplaceAccountError({ status: 401, code: "unauthenticated", message: "Inicia sesión para continuar." });

beforeEach(() => {
  vi.stubEnv("MARKETPLACE_MODE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
  cookieStore.get.mockReset();
  cookieStore.set.mockReset();
  cookieStore.delete.mockReset();
  refresh.mockReset();
  vi.mocked(getCart).mockReset();
  vi.mocked(setCartItem).mockReset();
});

describe("addToCart como invitado", () => {
  it("agrega una unidad en mp_cart y refresca", async () => {
    withCookies({ cart: [] });

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state).toEqual({ status: "added", message: null });
    expect(writtenCart()).toEqual([{ ...ref, quantity: 1 }]);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("suma sobre la línea existente y topa en 99", async () => {
    withCookies({ cart: [{ ...ref, quantity: 99 }] });

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state).toEqual({ status: "error", message: "Ya tienes 99 unidades de este producto." });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("la línea 21 responde carrito lleno sin escribir", async () => {
    const twenty = Array.from({ length: 20 }, (_, index) => ({ store_slug: STORE, product_slug: `p-${index}`, quantity: 1 }));
    withCookies({ cart: twenty });

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state).toEqual({ status: "error", message: "Tu carrito admite hasta 20 productos." });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("con el interruptor apagado no hace nada", async () => {
    vi.stubEnv("MARKETPLACE_MODE", "api");
    vi.stubEnv("MARKETPLACE_CART_ENABLED", undefined);
    withCookies({ cart: [] });

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state).toEqual(INITIAL_ADD_TO_CART_STATE);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});

describe("addToCart con sesión", () => {
  it("manda la cantidad actual más uno", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(getCart).mockResolvedValue(cartWith(2));
    vi.mocked(setCartItem).mockResolvedValue(cartWith(3));

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state.status).toBe("added");
    expect(setCartItem).toHaveBeenCalledWith(expect.objectContaining({ session: "7|token" }), { ...ref, quantity: 3 });
  });

  it("en 99 no manda 100", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(getCart).mockResolvedValue(cartWith(99));

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state).toEqual({ status: "error", message: "Ya tienes 99 unidades de este producto." });
    expect(setCartItem).not.toHaveBeenCalled();
  });

  it("si la API topa la cantidad al stock, avisa cuántas hay en lugar de Agregado", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(getCart).mockResolvedValue(cartWith(3));
    vi.mocked(setCartItem).mockResolvedValue(cartWith(3));

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state).toEqual({ status: "error", message: "Sólo hay 3 unidades disponibles." });
    expect(refresh).toHaveBeenCalled();
  });

  it("un 429 dice cuántos segundos esperar", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(getCart).mockResolvedValue(cartWith(0));
    vi.mocked(setCartItem).mockRejectedValue(
      new MarketplaceAccountError({ status: 429, code: "too_many_attempts", message: "Demasiados intentos.", retryAfter: 42 }),
    );

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state).toEqual({ status: "error", message: "Demasiados intentos. Prueba de nuevo en 42 segundos." });
  });

  it("un error de la API llega con su mensaje", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(getCart).mockResolvedValue(cartWith(0));
    vi.mocked(setCartItem).mockRejectedValue(
      new MarketplaceAccountError({ status: 422, code: "not_orderable", message: "Esta tienda no vende este producto en línea." }),
    );

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state).toEqual({ status: "error", message: "Esta tienda no vende este producto en línea." });
  });

  it("con la API caída responde el aviso genérico", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(getCart).mockRejectedValue(new MarketplaceUnavailableError("/me/cart"));

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state).toEqual({ status: "error", message: "No pudimos agregar el producto. Intenta de nuevo." });
  });

  it("un código sin mapear responde el aviso genérico y no lanza", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(getCart).mockRejectedValue(
      new MarketplaceAccountError({ status: 409, code: "quote_changed", message: "Algo cambió." }),
    );

    expect(await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref))).toEqual({ status: "error", message: "No pudimos agregar el producto. Intenta de nuevo." });
  });

  it("un 401 borra mp_session y agrega como invitado", async () => {
    withCookies({ session: "7|vencido", cart: [] });
    vi.mocked(getCart).mockRejectedValue(unauthenticated());

    const state = await addToCart(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(state.status).toBe("added");
    expect(deleted("mp_session")).toBe(true);
    expect(writtenCart()).toEqual([{ ...ref, quantity: 1 }]);
  });
});

describe("setQuantity y removeLine", () => {
  it("un 401 en setQuantity borra mp_session y escribe en mp_cart", async () => {
    withCookies({ session: "7|vencido", cart: [{ ...ref, quantity: 1 }] });
    vi.mocked(setCartItem).mockRejectedValue(unauthenticated());

    await setQuantity(INITIAL_ADD_TO_CART_STATE, form({ ...ref, quantity: "4" }));

    expect(deleted("mp_session")).toBe(true);
    expect(writtenCart()).toEqual([{ ...ref, quantity: 4 }]);
  });

  it("removeLine de invitado quita la línea y borra la cookie vacía", async () => {
    withCookies({ cart: [{ ...ref, quantity: 1 }] });

    await removeLine(INITIAL_ADD_TO_CART_STATE, form(ref));

    expect(deleted("mp_cart")).toBe(true);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each([
    ["not_orderable", "Esta tienda no vende este producto en línea."],
    ["product_restricted", "Este producto se vende sólo en tienda."],
  ] as const)("removeLine con %s devuelve el mensaje de la API y refresca", async (code, message) => {
    withCookies({ session: "7|token" });
    vi.mocked(setCartItem).mockRejectedValue(new MarketplaceAccountError({ status: 422, code, message }));

    await expect(removeLine(INITIAL_ADD_TO_CART_STATE, form(ref))).resolves.toEqual({ status: "error", message });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("setQuantity con sesión devuelve added y refresca", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(setCartItem).mockResolvedValue(cartWith(4));

    await expect(setQuantity(INITIAL_ADD_TO_CART_STATE, form({ ...ref, quantity: "4" }))).resolves.toEqual({ status: "added", message: null });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("un código no mapeado da el mensaje genérico, sin lanzar ni refrescar", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(setCartItem).mockRejectedValue(new MarketplaceAccountError({ status: 500, code: "open_orders", message: "texto de la API" }));

    await expect(setQuantity(INITIAL_ADD_TO_CART_STATE, form({ ...ref, quantity: "2" }))).resolves.toEqual({
      status: "error",
      message: "No pudimos actualizar el carrito. Intenta de nuevo.",
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("too_many_attempts arma los segundos con retryAfter", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(setCartItem).mockRejectedValue(
      new MarketplaceAccountError({ status: 429, code: "too_many_attempts", message: "x", retryAfter: 30 }),
    );

    const state = await removeLine(INITIAL_ADD_TO_CART_STATE, form(ref));
    expect(state.message).toBe("Demasiados intentos. Prueba de nuevo en 30 segundos.");
  });

  it("la API caída da un aviso en vez de subir a error.tsx", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(setCartItem).mockRejectedValue(new MarketplaceUnavailableError("/me/cart/items"));

    await expect(removeLine(INITIAL_ADD_TO_CART_STATE, form(ref))).resolves.toEqual({
      status: "error",
      message: "No pudimos actualizar el carrito. Intenta de nuevo.",
    });
  });

  it("una cantidad fuera de rango avisa y no escribe", async () => {
    withCookies({ cart: [{ ...ref, quantity: 1 }] });

    await expect(setQuantity(INITIAL_ADD_TO_CART_STATE, form({ ...ref, quantity: "100" }))).resolves.toEqual({
      status: "error",
      message: "La cantidad debe estar entre 1 y 99.",
    });
    await expect(setQuantity(INITIAL_ADD_TO_CART_STATE, form({ ...ref, quantity: "0" }))).resolves.toMatchObject({ status: "error" });

    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("una referencia inválida avisa y no llama a la API", async () => {
    withCookies({ session: "7|token" });

    await expect(removeLine(INITIAL_ADD_TO_CART_STATE, form({ store_slug: "", product_slug: PRODUCT }))).resolves.toEqual({
      status: "error",
      message: "No pudimos actualizar el carrito. Intenta de nuevo.",
    });
    expect(setCartItem).not.toHaveBeenCalled();
  });
});
