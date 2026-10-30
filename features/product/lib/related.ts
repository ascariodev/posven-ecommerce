import type { SearchItem } from "@/lib/marketplace/schemas";

export const RELATED_LIMIT = 5;

export function relatedSections(
  currentSlug: string,
  togetherItems: SearchItem[],
  alsoViewedItems: SearchItem[],
): { together: SearchItem[]; alsoViewed: SearchItem[] } {
  const together = togetherItems
    .filter((item) => item.slug !== currentSlug)
    .slice(0, RELATED_LIMIT);
  const shown = new Set(together.map((item) => item.slug));
  const alsoViewed = alsoViewedItems
    .filter((item) => item.slug !== currentSlug && !shown.has(item.slug))
    .slice(0, RELATED_LIMIT);
  return { together, alsoViewed };
}
