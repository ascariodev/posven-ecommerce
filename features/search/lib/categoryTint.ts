import type { Category } from "@/lib/marketplace/schemas";

const TINTS = [
  { bg: "bg-primary-soft", fg: "text-primary-text" },
  { bg: "bg-success-soft", fg: "text-success" },
  { bg: "bg-warning-soft", fg: "text-warning" },
  { bg: "bg-muted", fg: "text-muted-foreground" },
] as const;

export function categoryTint(category: Category | null): { bg: string; fg: string } {
  const slug = category?.slug ?? "";
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) % TINTS.length;
  return TINTS[hash];
}
