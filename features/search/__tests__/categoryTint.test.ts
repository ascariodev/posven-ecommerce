import { describe, expect, it } from "vitest";
import type { Category } from "@/lib/marketplace/schemas";
import { categoryTint } from "@/features/search/lib/categoryTint";

function category(slug: string): Category {
  return { slug, name: slug, parent_slug: null };
}

describe("categoryTint", () => {
  it("el mismo slug da la misma pareja", () => {
    expect(categoryTint(category("farmacia"))).toEqual(categoryTint(category("farmacia")));
  });

  it("sin categoría usa tint-1", () => {
    expect(categoryTint(null)).toEqual({ bg: "bg-tint-1", fg: "text-tint-1-foreground" });
  });

  it("las cuatro parejas son alcanzables", () => {
    const slugs = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const backgrounds = new Set(slugs.map((slug) => categoryTint(category(slug)).bg));
    expect([...backgrounds].sort()).toEqual(["bg-tint-1", "bg-tint-2", "bg-tint-3", "bg-tint-4"]);
  });
});
