import { describe, expect, it } from "vitest";
import { checkoutHref, readCheckoutParams } from "@/features/checkout/lib/params";

describe("readCheckoutParams", () => {
  it("lee la dirección, las tiendas con entrega y las que se pagan en tienda", () => {
    expect(
      readCheckoutParams({
        direccion: "12",
        "f-farmacia-central-valencia": "delivery",
        "f-abasto-la-esquina": "pickup",
        "p-abasto-la-esquina": "in_store",
        "p-farmacia-central-valencia": "online",
      }),
    ).toEqual({ addressId: 12, delivery: ["farmacia-central-valencia"], inStore: ["abasto-la-esquina"] });
  });

  it.each([
    ["dirección no numérica", { direccion: "doce" }],
    ["dirección cero", { direccion: "0" }],
    ["dirección repetida", { direccion: ["1", "2"] }],
    ["entrega con otro valor", { "f-farmacia-central-valencia": "domicilio" }],
    ["prefijo sin tienda", { "f-": "delivery" }],
    ["pago con otro valor", { "p-abasto-la-esquina": "tienda" }],
    ["pago sin tienda", { "p-": "in_store" }],
  ])("ignora %s", (_name, searchParams) => {
    expect(readCheckoutParams(searchParams)).toEqual({ addressId: null, delivery: [], inStore: [] });
  });
});

describe("checkoutHref", () => {
  it("sin elección es /checkout", () => {
    expect(checkoutHref(null, [])).toBe("/checkout");
  });

  it("guarda la dirección y las entregas", () => {
    expect(checkoutHref(3, ["farmacia-central-valencia"])).toBe("/checkout?direccion=3&f-farmacia-central-valencia=delivery");
  });

  it("guarda las tiendas que se pagan en tienda", () => {
    expect(checkoutHref(null, [], ["abasto-la-esquina"])).toBe("/checkout?p-abasto-la-esquina=in_store");
  });
});
