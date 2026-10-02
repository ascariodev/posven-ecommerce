"use server";

import { refresh } from "next/cache";
import {
  changePassword,
  createAddress,
  deleteAccount,
  deleteAddress,
  addFavorite,
  removeFavorite,
  updateAddress,
  updateMe,
  updateSettings,
} from "@/lib/marketplace/client";
import type { AccountContext } from "@/lib/marketplace/params";
import type { AddressInput, AddressPatch, Billing, ProfilePatch } from "@/lib/marketplace/schemas";
import {
  addressCoordsSchema,
  addressSchema,
  billingFormSchema,
  changePasswordSchema,
  deleteAccountSchema,
  profileSchema,
} from "../lib/formSchemas";
import { formStateFromError, formStateFromZod, type FormState } from "../lib/formState";
import { safeReturnPath } from "../lib/returnPath";
import { endSession, withSession } from "./session";

const PROFILE_PATH = "/cuenta/perfil";
const ADDRESSES_PATH = "/cuenta/direcciones";
const SETTINGS_PATH = "/cuenta/configuracion";
const FAVORITES_PATH = "/cuenta/favoritos";

const PROFILE_SAVED = "Guardamos tus datos.";
const PASSWORD_CHANGED = "Cambiamos tu contraseña y cerramos tus otras sesiones.";
const BILLING_SAVED = "Guardamos tus datos de facturación.";
const BILLING_CLEARED = "Borramos tus datos de facturación.";
const SETTINGS_SAVED = "Guardamos tus avisos.";
const ADDRESS_SAVED = "Guardamos la dirección.";
const COORDS_REQUIRED =
  "Toca Usar mi ubicación para guardar la dirección. Sin ubicación sólo podrás retirar en tienda.";
const ADDRESS_NOT_FOUND = "No encontrado.";
const NOT_FOUND = "No encontrado.";
const FAVORITE_ADDED = "Guardamos el favorito.";
const FAVORITE_REMOVED = "Quitamos el favorito.";
const ADDRESS_DELETED = "Eliminamos la dirección.";
const ADDRESS_DEFAULTED = "Marcamos la dirección como predeterminada.";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function pick(formData: FormData, names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, field(formData, name)]));
}

function success(message: string, values: Record<string, string> = {}): FormState {
  return { status: "success", message, fields: {}, values };
}

function failure(message: string, values: Record<string, string>): FormState {
  return { status: "error", message, fields: {}, values };
}

// Number("") es 0 y sería una coordenada válida: un campo vacío es NaN.
function coordinate(raw: string): number {
  return raw.trim() === "" ? Number.NaN : Number(raw);
}

function addressId(formData: FormData): number | null {
  const raw = field(formData, "address_id");
  const id = raw.trim() === "" ? Number.NaN : Number(raw);
  return Number.isInteger(id) && id >= 1 ? id : null;
}

export async function updateProfile(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  const values = pick(formData, ["name", "phone", "email"]);
  const patch: ProfilePatch = { name: values.name, phone: values.phone };
  const changesEmail = values.email !== field(formData, "current_email");
  if (changesEmail) {
    patch.email = values.email;
    patch.current_password = field(formData, "current_password");
  }
  const parsed = profileSchema.safeParse(patch);
  if (!parsed.success) return formStateFromZod(parsed.error, values);
  return withSession(PROFILE_PATH, async (ctx) => {
    let message = PROFILE_SAVED;
    try {
      const customer = await updateMe(ctx, patch);
      if (changesEmail && customer.pending_email !== null) {
        message = `${PROFILE_SAVED} Te enviamos un enlace a ${customer.pending_email} para confirmar el correo nuevo. Hasta entonces sigues entrando con ${customer.email}.`;
      }
    } catch (error) {
      return formStateFromError(error, values);
    }
    refresh();
    return success(message, values);
  });
}

const BILLING_VALUE_NAMES = [
  "billing.document_type",
  "billing.document",
  "billing.name",
  "billing.phone",
  "billing.address",
  "billing.taxpayer_type",
];

export async function updateBilling(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  const values = pick(formData, BILLING_VALUE_NAMES);
  const parsed = billingFormSchema.safeParse(values);
  if (!parsed.success) return formStateFromZod(parsed.error, values);
  const billing = {
    document_type: values["billing.document_type"],
    document: values["billing.document"].trim(),
    name: values["billing.name"].trim(),
    phone: values["billing.phone"].trim(),
    address: values["billing.address"].trim(),
    taxpayer_type: values["billing.taxpayer_type"],
  } as Billing;
  return withSession(PROFILE_PATH, async (ctx) => {
    try {
      await updateMe(ctx, { billing });
    } catch (error) {
      return formStateFromError(error, values);
    }
    refresh();
    return success(BILLING_SAVED, values);
  });
}

export async function clearBilling(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  void formData;
  return withSession(PROFILE_PATH, async (ctx) => {
    try {
      await updateMe(ctx, { billing: null });
    } catch (error) {
      return formStateFromError(error, {});
    }
    refresh();
    return success(BILLING_CLEARED);
  });
}

export async function changePasswordAction(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  const input = { current_password: field(formData, "current_password"), password: field(formData, "password") };
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return formStateFromZod(parsed.error, {});
  return withSession(SETTINGS_PATH, async (ctx) => {
    try {
      await changePassword(ctx, input);
    } catch (error) {
      return formStateFromError(error, {});
    }
    return success(PASSWORD_CHANGED);
  });
}

export async function updateSettingsAction(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  const orderStatusEmails = field(formData, "order_status_emails") === "on";
  return withSession(SETTINGS_PATH, async (ctx) => {
    try {
      await updateSettings(ctx, { order_status_emails: orderStatusEmails });
    } catch (error) {
      return formStateFromError(error, {});
    }
    refresh();
    return success(SETTINGS_SAVED);
  });
}

export async function deleteAccountAction(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  const password = field(formData, "password");
  const parsed = deleteAccountSchema.safeParse({ password });
  if (!parsed.success) return formStateFromZod(parsed.error, {});
  return withSession(SETTINGS_PATH, async (ctx) => {
    try {
      await deleteAccount(ctx, { password });
    } catch (error) {
      return formStateFromError(error, {});
    }
    return endSession("/");
  });
}

const ADDRESS_VALUE_NAMES = ["address_id", "label", "recipient_name", "phone", "city_slug", "line", "reference"];

export async function saveAddress(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  const values = pick(formData, ADDRESS_VALUE_NAMES);
  const isDefault = field(formData, "is_default") === "on";
  if (isDefault) values.is_default = "on";
  const reference = values.reference.trim() === "" ? null : values.reference;
  const id = values.address_id.trim() === "" ? null : addressId(formData);
  if (values.address_id.trim() !== "" && id === null) return failure(ADDRESS_NOT_FOUND, values);
  const parsed = addressSchema.safeParse(values);
  if (!parsed.success) return formStateFromZod(parsed.error, values);

  if (id === null) {
    const lat = coordinate(field(formData, "lat"));
    const lng = coordinate(field(formData, "lng"));
    if (!addressCoordsSchema.safeParse({ lat, lng }).success) return failure(COORDS_REQUIRED, values);
    const input: AddressInput = {
      label: values.label,
      recipient_name: values.recipient_name,
      phone: values.phone,
      city_slug: values.city_slug,
      line: values.line,
      reference,
      lat,
      lng,
      is_default: isDefault,
    };
    return withSession(ADDRESSES_PATH, async (ctx) => {
      try {
        await createAddress(ctx, input);
      } catch (error) {
        return formStateFromError(error, values);
      }
      refresh();
      return success(ADDRESS_SAVED);
    });
  }

  const patch: AddressPatch = {
    label: values.label,
    recipient_name: values.recipient_name,
    phone: values.phone,
    city_slug: values.city_slug,
    line: values.line,
    reference,
    is_default: isDefault,
  };
  if (field(formData, "coords_changed") === "1") {
    const lat = coordinate(field(formData, "lat"));
    const lng = coordinate(field(formData, "lng"));
    if (!addressCoordsSchema.safeParse({ lat, lng }).success) return failure(COORDS_REQUIRED, values);
    patch.lat = lat;
    patch.lng = lng;
  }
  return withSession(ADDRESSES_PATH, async (ctx) => {
    try {
      await updateAddress(ctx, id, patch);
    } catch (error) {
      return formStateFromError(error, values);
    }
    refresh();
    return success(ADDRESS_SAVED, values);
  });
}

async function addressAction(
  formData: FormData,
  run: (ctx: AccountContext, id: number) => Promise<unknown>,
  doneMessage: string,
): Promise<FormState> {
  const id = addressId(formData);
  if (id === null) return failure(ADDRESS_NOT_FOUND, {});
  const state = await withSession(ADDRESSES_PATH, async (ctx): Promise<FormState> => {
    try {
      await run(ctx, id);
    } catch (error) {
      return formStateFromError(error, {});
    }
    return success(doneMessage);
  });
  refresh();
  return state;
}

export async function deleteAddressAction(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  return addressAction(formData, (ctx, id) => deleteAddress(ctx, id), ADDRESS_DELETED);
}

export async function setDefaultAddress(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  return addressAction(formData, (ctx, id) => updateAddress(ctx, id, { is_default: true }), ADDRESS_DEFAULTED);
}

export async function toggleFavorite(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  const kind = field(formData, "kind");
  const mode = field(formData, "mode");
  const slug = field(formData, "slug");
  if ((kind !== "product" && kind !== "store") || (mode !== "add" && mode !== "remove") || slug === "") {
    return failure(NOT_FOUND, {});
  }
  const target = { kind, slug } as const;
  const state = await withSession(
    safeReturnPath(field(formData, "volver"), FAVORITES_PATH),
    async (ctx): Promise<FormState> => {
      try {
        await (mode === "add" ? addFavorite(ctx, target) : removeFavorite(ctx, target));
      } catch (error) {
        return formStateFromError(error, {});
      }
      return success(mode === "add" ? FAVORITE_ADDED : FAVORITE_REMOVED);
    },
  );
  refresh();
  return state;
}
