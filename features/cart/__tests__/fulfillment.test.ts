import { describe, expect, it } from "vitest";
import {
  checkoutPathFor,
  deliveryFromKey,
  deliveryKey,
  readDeliveryStores,
} from "@/features/cart/lib/fulfillment";

describe("readDeliveryStores", () => {
  it("lee las tiendas con entrega y deja el retiro", () => {
    expect(
      readDeliveryStores({ "f-farmacia-central-valencia": "delivery", "f-abasto-la-esquina": "pickup", direccion: "3" }),
    ).toEqual(["farmacia-central-valencia"]);
  });

  it.each([
    ["valor repetido", { "f-farmacia-central-valencia": ["delivery", "delivery"] }],
    ["otro valor", { "f-farmacia-central-valencia": "domicilio" }],
    ["prefijo sin tienda", { "f-": "delivery" }],
  ])("ignora %s", (_name, searchParams) => {
    expect(readDeliveryStores(searchParams)).toEqual([]);
  });
});

describe("deliveryKey", () => {
  it("es estable: ordena y no repite", () => {
    expect(deliveryKey(["b", "a", "b"])).toBe("a,b");
    expect(deliveryKey([])).toBe("");
  });

  it("vuelve a la lista", () => {
    expect(deliveryFromKey("a,b")).toEqual(["a", "b"]);
    expect(deliveryFromKey("")).toEqual([]);
  });
});

describe("checkoutPathFor", () => {
  it("sin elección es /checkout", () => {
    expect(checkoutPathFor([])).toBe("/checkout");
  });

  it("lleva la entrega elegida", () => {
    expect(checkoutPathFor(["farmacia-central-valencia"])).toBe("/checkout?f-farmacia-central-valencia=delivery");
  });
});
