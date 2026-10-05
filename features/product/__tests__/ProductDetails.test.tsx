import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProductDetails } from "@/features/product/components/ProductDetails";
import type { ProductDetail } from "@/lib/marketplace/schemas";

const base = {
  slug: "p",
  name: "Producto",
  ean: "7591234567890",
  brand: "Marca X",
  category: { slug: "c", name: "Analgésicos", parent_slug: null },
  image_url: null,
  attributes: [{ name: "Presentación", value: "Caja x 20" }],
  restriction: "none",
  is_unified: false,
} as unknown as ProductDetail;

afterEach(cleanup);

describe("ProductDetails", () => {
  it("muestra marca, categoría, EAN y venta en la sección abierta", () => {
    const { container } = render(<ProductDetails product={base} />);
    const [facts] = Array.from(container.querySelectorAll("details"));
    expect(facts.open).toBe(true);
    expect(screen.getByText("Marca X")).toBeTruthy();
    expect(screen.getByText("Analgésicos")).toBeTruthy();
    expect(screen.getByText("7591234567890")).toBeTruthy();
    expect(screen.getByText("Libre, sin récipe")).toBeTruthy();
  });

  it("los atributos van en una sección plegada", () => {
    const { container } = render(<ProductDetails product={base} />);
    const sections = Array.from(container.querySelectorAll("details"));
    expect(sections).toHaveLength(2);
    expect(sections[1].open).toBe(false);
    expect(screen.getByText("Caja x 20")).toBeTruthy();
  });

  it("sin atributos ni datos opcionales sólo queda la venta", () => {
    const product = { ...base, attributes: [], ean: null, brand: null, category: null, restriction: "recipe" } as ProductDetail;
    const { container } = render(<ProductDetails product={product} />);
    expect(container.querySelectorAll("details")).toHaveLength(1);
    expect(screen.getByText("Con récipe")).toBeTruthy();
  });
});
