import { describe, expect, it } from "vitest";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import { addressSchema, registerSchema } from "../lib/formSchemas";
import { formStateFromError, formStateFromZod } from "../lib/formState";

describe("formStateFromZod", () => {
  it("deja el primer mensaje de cada campo con la clave de la API y el mensaje general", () => {
    const result = registerSchema.safeParse({ name: "", email: "x", phone: "1", password: "" });
    if (result.success) throw new Error("debía fallar");

    expect(formStateFromZod(result.error, { email: "x" })).toEqual({
      status: "error",
      message: "Revisa los datos del formulario.",
      fields: {
        name: "Completa este campo.",
        email: "Escribe un correo válido.",
        phone: "Escribe un teléfono de 7 a 20 caracteres: números, espacios, paréntesis, guiones y + al inicio.",
        password: "Completa este campo.",
      },
      values: { email: "x" },
    });
  });

  it("usa las claves con guion bajo de la API", () => {
    const result = addressSchema.safeParse({
      label: "Casa",
      recipient_name: "",
      phone: "04121234567",
      city_slug: "",
      line: "Av.",
      reference: "",
    });
    if (result.success) throw new Error("debía fallar");

    expect(Object.keys(formStateFromZod(result.error, {}).fields).sort()).toEqual(["city_slug", "recipient_name"]);
  });
});

describe("formStateFromError", () => {
  it("un código sin mapear devuelve un mensaje genérico en vez de lanzar", () => {
    const error = new MarketplaceAccountError({ status: 409, code: "cart_empty", message: "Tu carrito está vacío." });

    expect(formStateFromError(error, { email: "a@b.co" })).toEqual({
      status: "error",
      message: "No pudimos completar la acción. Intenta de nuevo.",
      fields: {},
      values: { email: "a@b.co" },
    });
  });

  it("unauthenticated se relanza para que withSession redirija", () => {
    const error = new MarketplaceAccountError({ status: 401, code: "unauthenticated", message: "Inicia sesión." });

    expect(() => formStateFromError(error, {})).toThrow(error);
  });

  it("un error ajeno a la API se relanza", () => {
    const error = new Error("boom");

    expect(() => formStateFromError(error, {})).toThrow(error);
  });
});
