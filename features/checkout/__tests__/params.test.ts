import { describe, expect, it } from "vitest";
import { checkoutHref, readCheckoutParams } from "@/features/checkout/lib/params";

describe("readCheckoutParams", () => {
  it("lee la dirección y las tiendas con entrega", () => {
    expect(
      readCheckoutParams({ direccion: "12", "f-farmacia-central-valencia": "delivery", "f-abasto-la-esquina": "pickup" }),
    ).toEqual({ addressId: 12, delivery: ["farmacia-central-valencia"] });
  });

  it.each([
    ["dirección no numérica", { direccion: "doce" }],
    ["dirección cero", { direccion: "0" }],
    ["dirección repetida", { direccion: ["1", "2"] }],
    ["entrega con otro valor", { "f-farmacia-central-valencia": "domicilio" }],
    ["prefijo sin tienda", { "f-": "delivery" }],
  ])("ignora %s", (_name, searchParams) => {
    expect(readCheckoutParams(searchParams)).toEqual({ addressId: null, delivery: [] });
  });
});

describe("checkoutHref", () => {
  it("sin elección es /checkout", () => {
    expect(checkoutHref(null, [])).toBe("/checkout");
  });

  it("guarda la dirección y las entregas", () => {
    expect(checkoutHref(3, ["farmacia-central-valencia"])).toBe("/checkout?direccion=3&f-farmacia-central-valencia=delivery");
  });
});
