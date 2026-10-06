import { describe, expect, it } from "vitest";
import type { Category } from "@/lib/marketplace/schemas";
import { categoryPhoto } from "@/features/search/lib/categoryPhoto";

function category(slug: string, parent_slug: string | null = null): Category {
  return { slug, name: slug, parent_slug };
}

describe("categoryPhoto", () => {
  it.each([
    ["salud-y-medicamentos", "/brand/cat-salud.jpg"],
    ["alimentos", "/brand/cat-alimentos.jpg"],
    ["bebidas", "/brand/cat-bebidas.jpg"],
    ["ferreteria", "/brand/cat-ferreteria.jpg"],
  ])("la raíz %s tiene su foto", (slug, photo) => {
    expect(categoryPhoto(category(slug))).toBe(photo);
  });

  it("una hija usa la foto de su raíz", () => {
    expect(categoryPhoto(category("analgesicos", "salud-y-medicamentos"))).toBe("/brand/cat-salud.jpg");
  });

  it("sin categoría o con otra raíz da null", () => {
    expect(categoryPhoto(null)).toBeNull();
    expect(categoryPhoto(category("mascotas"))).toBeNull();
    expect(categoryPhoto(category("croquetas", "mascotas"))).toBeNull();
  });
});
