import { useEffect, useState } from "react";
import type { RadiusKm } from "@/lib/marketplace/params";
import { MIN_SUGGEST_LENGTH, type SuggestionsData } from "./panelItems";

const DEBOUNCE_MS = 200;

function isSuggestions(value: unknown): value is SuggestionsData {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.terms) && Array.isArray(candidate.products) && Array.isArray(candidate.categories)
  );
}

export function useSuggestions(query: string, radio: RadiusKm | null): SuggestionsData | null {
  const [data, setData] = useState<SuggestionsData | null>(null);
  const term = query.trim();

  useEffect(() => {
    if (term.length < MIN_SUGGEST_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: term, radio: radio === null ? "pais" : String(radio) });
      fetch(`/api/suggestions?${params.toString()}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((body: unknown) => setData(isSuggestions(body) ? body : null))
        .catch(() => undefined);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, radio]);

  return term.length < MIN_SUGGEST_LENGTH ? null : data;
}
