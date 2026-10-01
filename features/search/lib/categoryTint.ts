import type { Category } from "@/lib/marketplace/schemas";

const TINTS = [
  { bg: "bg-tint-1", fg: "text-tint-1-foreground" },
  { bg: "bg-tint-2", fg: "text-tint-2-foreground" },
  { bg: "bg-tint-3", fg: "text-tint-3-foreground" },
  { bg: "bg-tint-4", fg: "text-tint-4-foreground" },
] as const;

export function categoryTint(category: Category | null): { bg: string; fg: string } {
  const slug = category?.slug ?? "";
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) % TINTS.length;
  return TINTS[hash];
}
