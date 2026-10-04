import type { RadiusKm } from "@/lib/marketplace/params";
import type { SearchItem, SuggestionsResponse } from "@/lib/marketplace/schemas";
import { searchHref } from "./query";

export type SuggestionsData = Pick<SuggestionsResponse, "terms" | "products" | "categories">;

export type PanelItem =
  | { kind: "term" | "recent"; key: string; label: string; href: string }
  | { kind: "category"; key: string; label: string; term: string; href: string }
  | { kind: "product"; key: string; item: SearchItem; href: string };

export const MIN_SUGGEST_LENGTH = 2;

export function buildPanelItems({
  query,
  data,
  recents,
  radio,
}: {
  query: string;
  data: SuggestionsData | null;
  recents: string[];
  radio: RadiusKm | null;
}): PanelItem[] {
  const term = query.trim();
  const termHref = (q: string) => searchHref({ q, categoria: null, radio, pagina: 1 });
  const items: PanelItem[] = [];
  if (term.length >= MIN_SUGGEST_LENGTH && data !== null) {
    for (const label of data.terms) {
      items.push({ kind: "term", key: `term:${label}`, label, href: termHref(label) });
    }
    for (const item of data.products) {
      items.push({ kind: "product", key: `product:${item.slug}`, item, href: `/p/${item.slug}` });
    }
    for (const category of data.categories) {
      items.push({
        kind: "category",
        key: `category:${category.slug}`,
        label: category.name,
        term,
        href: searchHref({ q: term, categoria: category.slug, radio, pagina: 1 }),
      });
    }
  }
  for (const label of recents) {
    items.push({ kind: "recent", key: `recent:${label}`, label, href: termHref(label) });
  }
  return items;
}
