import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addFavorite,
  createAddress,
  deleteAccount,
  deleteAddress,
  removeFavorite,
  updateAddress,
  updateMe,
} from "@/lib/marketplace/client";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import type { Address, Customer } from "@/lib/marketplace/schemas";
import { refresh } from "next/cache";
import {
  deleteAccountAction,
  deleteAddressAction,
  saveAddress,
  setDefaultAddress,
  toggleFavorite,
  updateProfile,
} from "@/features/account/server/accountActions";
import { INITIAL_FORM_STATE } from "@/features/account/lib/formState";

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`);
  }),
}));

vi.mock("next/cache", () => ({
  refresh: vi.fn(),
}));

vi.mock("@/lib/marketplace/client", () => ({
  getMe: vi.fn(),
  updateMe: vi.fn(),
  changePassword: vi.fn(),
  updateSettings: vi.fn(),
  deleteAccount: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));

const ctx = { session: "12|abc", clientIp: null };

const customer: Customer = {
  name: "Comprador",
  email: "comprador@posven.test",
  phone: "+584141234567",
  email_verified: true,
  pending_email: null,
  settings: { order_status_emails: true },
};

const address: Address = {
  id: 3,
  label: "Casa",
  recipient_name: "Comprador",
  phone: "+584141234567",
  city: { slug: "valencia", name: "Valencia" },
  line: "Av. Bolívar Norte",
  reference: null,
  lat: 10.162,
  lng: -68.007,
  is_default: true,
};

const unauthenticated = new MarketplaceAccountError({
  status: 401,
  code: "unauthenticated",
  message: "Inicia sesión para continuar.",
});

function withSessionCookie(value: string | null): void {
  cookieStore.get.mockImplementation((name: string) =>
    name === "mp_session" && value !== null ? { name, value } : undefined,
  );
}

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) formData.set(name, value);
  return formData;
}

const addressFields = {
  label: "Casa",
  recipient_name: "Comprador",
  phone: "+584141234567",
  city_slug: "valencia",
  line: "Av. Bolívar Norte",
  reference: "",
};

afterEach(() => {
  cookieStore.get.mockReset();
  cookieStore.set.mockReset();
  cookieStore.delete.mockReset();
  vi.mocked(refresh).mockReset();
  vi.mocked(updateMe).mockReset();
  vi.mocked(createAddress).mockReset();
  vi.mocked(updateAddress).mockReset();
  vi.mocked(deleteAddress).mockReset();
  vi.mocked(addFavorite).mockReset();
  vi.mocked(removeFavorite).mockReset();
  vi.mocked(deleteAccount).mockReset();
});

describe("updateProfile", () => {
  it("sin cambio de correo no manda email ni current_password", async () => {
    withSessionCookie("12|abc");
    vi.mocked(updateMe).mockResolvedValue(customer);

    const state = await updateProfile(
      INITIAL_FORM_STATE,
      form({
        name: "Comprador editado",
        phone: customer.phone,
        email: customer.email,
        current_email: customer.email,
        current_password: "clave-segura-1",
      }),
    );

    expect(updateMe).toHaveBeenCalledWith(ctx, { name: "Comprador editado", phone: customer.phone });
    expect(state.status).toBe("success");
    expect(state.message).toBe("Guardamos tus datos.");
  });

  it("con correo nuevo manda email y current_password", async () => {
    withSessionCookie("12|abc");
    vi.mocked(updateMe).mockResolvedValue({ ...customer, pending_email: "nuevo@posven.test" });

    const state = await updateProfile(
      INITIAL_FORM_STATE,
      form({
        name: customer.name,
        phone: customer.phone,
        email: "nuevo@posven.test",
        current_email: customer.email,
        current_password: "clave-segura-1",
      }),
    );

    expect(updateMe).toHaveBeenCalledWith(ctx, {
      name: customer.name,
      phone: customer.phone,
      email: "nuevo@posven.test",
      current_password: "clave-segura-1",
    });
    expect(state.message).toContain(
      "Te enviamos un enlace a nuevo@posven.test para confirmar el correo nuevo. Hasta entonces sigues entrando con comprador@posven.test.",
    );
    expect(state.values).not.toHaveProperty("current_password");
  });
});

describe("saveAddress", () => {
  it("una dirección nueva sin coordenadas devuelve el aviso sin llamar a la API (RN-ACCOUNT-06)", async () => {
    withSessionCookie("12|abc");

    const state = await saveAddress(
      INITIAL_FORM_STATE,
      form({ ...addressFields, address_id: "", lat: "", lng: "", coords_changed: "" }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe(
      "Toca Usar mi ubicación para guardar la dirección. Sin ubicación sólo podrás retirar en tienda.",
    );
    expect(createAddress).not.toHaveBeenCalled();
  });

  it("una edición sin coords_changed no manda lat ni lng", async () => {
    withSessionCookie("12|abc");
    vi.mocked(updateAddress).mockResolvedValue(address);

    const state = await saveAddress(
      INITIAL_FORM_STATE,
      form({ ...addressFields, address_id: "3", lat: "10.162", lng: "-68.007", coords_changed: "" }),
    );

    expect(updateAddress).toHaveBeenCalledTimes(1);
    const [, id, patch] = vi.mocked(updateAddress).mock.calls[0];
    expect(id).toBe(3);
    expect(patch).not.toHaveProperty("lat");
    expect(patch).not.toHaveProperty("lng");
    expect(patch.reference).toBeNull();
    expect(state.message).toBe("Guardamos la dirección.");
    expect(refresh).toHaveBeenCalled();
  });
});

describe("toggleFavorite", () => {
  const productPath = "/p/acetaminofen-500-mg-20-tabletas";

  it("con unauthenticated borra mp_session y lleva a entrar con volver", async () => {
    withSessionCookie("12|abc");
    vi.mocked(addFavorite).mockRejectedValue(unauthenticated);

    await expect(
      toggleFavorite(
        form({ kind: "product", slug: "acetaminofen-500-mg-20-tabletas", mode: "add", volver: productPath }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/entrar?volver=%2Fp%2Facetaminofen-500-mg-20-tabletas");
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: "mp_session", path: "/" });
  });

  it("con not_found no lanza", async () => {
    withSessionCookie("12|abc");
    vi.mocked(removeFavorite).mockRejectedValue(
      new MarketplaceAccountError({ status: 404, code: "not_found", message: "No encontrado." }),
    );

    await expect(
      toggleFavorite(form({ kind: "store", slug: "ya-no-existe", mode: "remove", volver: "/cuenta/favoritos" })),
    ).resolves.toBeUndefined();
    expect(refresh).toHaveBeenCalled();
  });
});

describe("deleteAddressAction", () => {
  const notFound = new MarketplaceAccountError({ status: 404, code: "not_found", message: "No encontrado." });

  it("elimina, refresca y devuelve éxito", async () => {
    withSessionCookie("12|abc");
    vi.mocked(deleteAddress).mockResolvedValue(undefined);

    const state = await deleteAddressAction(INITIAL_FORM_STATE, form({ address_id: "3" }));

    expect(deleteAddress).toHaveBeenCalledWith(expect.anything(), 3);
    expect(state).toMatchObject({ status: "success", message: "Eliminamos la dirección." });
    expect(refresh).toHaveBeenCalled();
  });

  it("con not_found devuelve error y refresca la lista", async () => {
    withSessionCookie("12|abc");
    vi.mocked(deleteAddress).mockRejectedValue(notFound);

    const state = await deleteAddressAction(INITIAL_FORM_STATE, form({ address_id: "3" }));

    expect(state).toMatchObject({ status: "error", message: "No encontrado." });
    expect(refresh).toHaveBeenCalled();
  });

  it("con un código sin mapear devuelve el mensaje genérico", async () => {
    withSessionCookie("12|abc");
    vi.mocked(deleteAddress).mockRejectedValue(
      new MarketplaceAccountError({ status: 409, code: "cart_empty", message: "texto de la API" }),
    );

    const state = await deleteAddressAction(INITIAL_FORM_STATE, form({ address_id: "3" }));

    expect(state).toMatchObject({ status: "error", message: "No pudimos completar la acción. Intenta de nuevo." });
  });

  it("con un id inválido devuelve error sin llamar a la API", async () => {
    withSessionCookie("12|abc");

    const state = await deleteAddressAction(INITIAL_FORM_STATE, form({ address_id: "abc" }));

    expect(state).toMatchObject({ status: "error", message: "No encontrado." });
    expect(deleteAddress).not.toHaveBeenCalled();
  });

  it("con unauthenticated borra mp_session y lleva a entrar", async () => {
    withSessionCookie("12|abc");
    vi.mocked(deleteAddress).mockRejectedValue(unauthenticated);

    await expect(deleteAddressAction(INITIAL_FORM_STATE, form({ address_id: "3" }))).rejects.toThrow(
      "NEXT_REDIRECT:/entrar?volver=%2Fcuenta%2Fdirecciones",
    );
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: "mp_session", path: "/" });
  });
});

describe("setDefaultAddress", () => {
  it("marca como predeterminada, refresca y devuelve éxito", async () => {
    withSessionCookie("12|abc");
    vi.mocked(updateAddress).mockResolvedValue(address);

    const state = await setDefaultAddress(INITIAL_FORM_STATE, form({ address_id: "3" }));

    expect(updateAddress).toHaveBeenCalledWith(expect.anything(), 3, { is_default: true });
    expect(state).toMatchObject({ status: "success", message: "Marcamos la dirección como predeterminada." });
    expect(refresh).toHaveBeenCalled();
  });

  it("con not_found devuelve error y refresca la lista", async () => {
    withSessionCookie("12|abc");
    vi.mocked(updateAddress).mockRejectedValue(
      new MarketplaceAccountError({ status: 404, code: "not_found", message: "No encontrado." }),
    );

    const state = await setDefaultAddress(INITIAL_FORM_STATE, form({ address_id: "3" }));

    expect(state).toMatchObject({ status: "error", message: "No encontrado." });
    expect(refresh).toHaveBeenCalled();
  });
});

describe("deleteAccountAction", () => {
  it("con la contraseña errada devuelve el error en fields.password y no borra la cookie", async () => {
    withSessionCookie("12|abc");
    vi.mocked(deleteAccount).mockRejectedValue(
      new MarketplaceAccountError({
        status: 422,
        code: "validation_failed",
        message: "Revisa los datos del formulario.",
        fields: { password: "La contraseña no es correcta." },
      }),
    );

    const state = await deleteAccountAction(INITIAL_FORM_STATE, form({ password: "equivocada" }));

    expect(state.status).toBe("error");
    expect(state.fields.password).toBe("La contraseña no es correcta.");
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("con pedidos en curso muestra el mensaje de la API y no borra la cookie", async () => {
    withSessionCookie("12|abc");
    vi.mocked(deleteAccount).mockRejectedValue(
      new MarketplaceAccountError({
        status: 409,
        code: "open_orders",
        message: "Tienes pedidos en curso. Podrás eliminar tu cuenta cuando se entreguen.",
      }),
    );

    const state = await deleteAccountAction(INITIAL_FORM_STATE, form({ password: "clave-segura-1" }));

    expect(state).toMatchObject({
      status: "error",
      message: "Tienes pedidos en curso. Podrás eliminar tu cuenta cuando se entreguen.",
    });
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("con éxito borra mp_session con path / y redirige a /", async () => {
    withSessionCookie("12|abc");
    vi.mocked(deleteAccount).mockResolvedValue(undefined);

    await expect(deleteAccountAction(INITIAL_FORM_STATE, form({ password: "clave-segura-1" }))).rejects.toThrow(
      "NEXT_REDIRECT:/",
    );
    expect(deleteAccount).toHaveBeenCalledWith(ctx, { password: "clave-segura-1" });
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: "mp_session", path: "/" });
  });
});
