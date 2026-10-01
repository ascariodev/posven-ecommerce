import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SearchItem } from "@/lib/marketplace/schemas";
import { ProductCard } from "@/features/search/components/ProductCard";

function item(overrides: Partial<SearchItem> = {}): SearchItem {
  return {
    slug: "acetaminofen-500-mg-20-tabletas",
    name: "Acetaminofén 500 mg 20 tabletas",
    ean: null,
    brand: "Genven",
    category: null,
    image_url: null,
    attributes: [],
    restriction: "none",
    is_unified: true,
    offers_count: 1,
    min_price_usd: "1.50",
    min_price_ves: "54.75",
    nearest_km: 1.2,
    outside_radius: false,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("ProductCard", () => {
  it("avisa que requiere récipe", () => {
    render(<ProductCard item={item({ restriction: "recipe" })} />);
    expect(screen.getByText("Requiere récipe")).toBeTruthy();
  });

  it("con una sola oferta no antepone Desde", () => {
    render(<ProductCard item={item({ offers_count: 1 })} />);
    expect(screen.queryByText(/Desde/)).toBeNull();
    expect(screen.getByText("$ 1,50")).toBeTruthy();
    expect(screen.getByText("En 1 tienda", { exact: false })).toBeTruthy();
  });

  it("con varias ofertas antepone Desde", () => {
    render(<ProductCard item={item({ offers_count: 3 })} />);
    expect(screen.getByText("Desde $ 1,50")).toBeTruthy();
    expect(screen.getByText("Desde Bs 54,75")).toBeTruthy();
    expect(screen.getByText("En 3 tiendas", { exact: false })).toBeTruthy();
  });

  it("marca lo que queda fuera del radio", () => {
    render(<ProductCard item={item({ outside_radius: true })} />);
    expect(screen.getByText("Fuera de tu zona")).toBeTruthy();
  });
});
