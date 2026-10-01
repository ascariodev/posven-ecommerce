import { CupSoda, Package, Pill } from "lucide-react";
import { describe, expect, it } from "vitest";
import { categoryIcon } from "@/features/search/lib/categoryIcon";

describe("categoryIcon", () => {
  it("una hija toma el ícono de su raíz", () => {
    expect(
      categoryIcon({ slug: "analgesicos", name: "Analgésicos", parent_slug: "salud-y-medicamentos" }),
    ).toBe(Pill);
  });

  it("una raíz toma su propio ícono", () => {
    expect(categoryIcon({ slug: "bebidas", name: "Bebidas", parent_slug: null })).toBe(CupSoda);
  });

  it("sin categoría devuelve Package", () => {
    expect(categoryIcon(null)).toBe(Package);
  });

  it("una raíz sin mapeo devuelve Package", () => {
    expect(categoryIcon({ slug: "juguetes", name: "Juguetes", parent_slug: null })).toBe(Package);
  });
});
