import { describe, expect, it } from "vitest";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import { formStateFromError } from "../lib/formState";

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
