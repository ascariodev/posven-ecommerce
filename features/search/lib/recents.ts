const STORAGE_KEY = "recent-searches";
export const MAX_RECENTS = 5;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readRecents(): string[] {
  const store = storage();
  if (store === null) return [];
  try {
    const parsed: unknown = JSON.parse(store.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string").slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

export function addRecent(term: string): string[] {
  const clean = term.trim();
  const current = readRecents();
  if (clean === "") return current;
  const next = [clean, ...current.filter((value) => value.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    MAX_RECENTS,
  );
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return current;
  }
  return next;
}
