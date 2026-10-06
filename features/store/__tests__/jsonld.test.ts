import { describe, expect, it } from "vitest";
import type { Store } from "@/lib/marketplace/schemas";
import { storeJsonLd } from "../lib/jsonld";

function store(overrides: Partial<Store> = {}): Store {
  return {
    slug: "farmacia-central-valencia",
    name: "Farmacia Central",
    company_name: "Farmacia Central C.A.",
    logo_url: "https://cdn.example.com/logo.png",
    cover_url: null,
    address: "Av. Bolívar Norte",
    city: { slug: "valencia", name: "Valencia" },
    latitude: 10.18,
    longitude: -68.0,
    phone: "+582410000000",
    whatsapp: null,
    is_premium: true,
    accepts_orders: false,
    schedule: [],
    ...overrides,
  };
}

describe("storeJsonLd", () => {
  it("una tienda premium con logo trae image", () => {
    expect(storeJsonLd(store())).toMatchObject({ image: "https://cdn.example.com/logo.png" });
  });

  it("una tienda sin premium con logo también trae image", () => {
    expect(storeJsonLd(store({ is_premium: false }))).toMatchObject({ image: "https://cdn.example.com/logo.png" });
  });

  it("sin logo no trae image", () => {
    expect(storeJsonLd(store({ logo_url: null }))).not.toHaveProperty("image");
  });

  it("sin teléfono no trae telephone", () => {
    expect(storeJsonLd(store({ phone: null }))).not.toHaveProperty("telephone");
  });
});
