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

  it("sin categoría usa la primera pareja", () => {
    expect(categoryTint(null)).toEqual({ bg: "bg-primary-soft", fg: "text-primary-text" });
  });

  it("las cuatro parejas son alcanzables", () => {
    const slugs = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const backgrounds = new Set(slugs.map((slug) => categoryTint(category(slug)).bg));
    expect([...backgrounds].sort()).toEqual(["bg-muted", "bg-primary-soft", "bg-success-soft", "bg-warning-soft"]);
  });
});
