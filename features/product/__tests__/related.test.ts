import { describe, expect, it } from "vitest";
import { relatedSections } from "@/features/product/lib/related";
import type { SearchItem } from "@/lib/marketplace/schemas";

function items(...slugs: string[]): SearchItem[] {
  return slugs.map((slug) => ({ slug }) as SearchItem);
}

function slugs(list: SearchItem[]): string[] {
  return list.map((item) => item.slug);
}

describe("relatedSections", () => {
  it("quita el producto actual de las dos secciones", () => {
    const { together, alsoViewed } = relatedSections("a", items("a", "b"), items("c", "a"));
    expect(slugs(together)).toEqual(["b"]);
    expect(slugs(alsoViewed)).toEqual(["c"]);
  });

  it("la segunda sección no repite lo ya mostrado en la primera", () => {
    const { together, alsoViewed } = relatedSections(
      "x",
      items("a", "b", "c"),
      items("b", "d", "a", "e"),
    );
    expect(slugs(together)).toEqual(["a", "b", "c"]);
    expect(slugs(alsoViewed)).toEqual(["d", "e"]);
  });

  it("limita cada sección a cinco", () => {
    const many = items("a", "b", "c", "d", "e", "f", "g");
    const { together, alsoViewed } = relatedSections("x", many, items("h", "i", "j", "k", "l", "m"));
    expect(together).toHaveLength(5);
    expect(slugs(alsoViewed)).toEqual(["h", "i", "j", "k", "l"]);
  });

  it("sólo descuenta de la segunda lo mostrado, no lo recortado de la primera", () => {
    const { alsoViewed } = relatedSections(
      "x",
      items("a", "b", "c", "d", "e", "f"),
      items("f", "g"),
    );
    expect(slugs(alsoViewed)).toEqual(["f", "g"]);
  });
});
