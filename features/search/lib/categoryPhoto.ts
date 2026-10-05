import type { Category } from "@/lib/marketplace/schemas";

const ROOT_PHOTOS: Record<string, string> = {
  "salud-y-medicamentos": "/brand/cat-salud.jpg",
  alimentos: "/brand/cat-alimentos.jpg",
  bebidas: "/brand/cat-bebidas.jpg",
  ferreteria: "/brand/cat-ferreteria.jpg",
};

/** Foto de la categoría raíz para productos sin imagen propia; null si no hay una. */
export function categoryPhoto(category: Category | null): string | null {
  if (category === null) return null;
  return ROOT_PHOTOS[category.parent_slug ?? category.slug] ?? null;
}
