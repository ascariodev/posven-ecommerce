import { DEFAULT_RADIUS_KM, RADIUS_OPTIONS, type RadiusKm } from "@/lib/marketplace/params";

export type SearchQuery = {
  q: string;
  categoria: string | null;
  radio: RadiusKm | null;
  pagina: number;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

const MAX_QUERY_LENGTH = 100;
const CATEGORY_SLUG = /^[a-z0-9-]+$/;
const POSITIVE_INTEGER = /^\d+$/;
const NATIONWIDE = "pais";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseRadius(value: string | undefined): RadiusKm | null {
  if (value === NATIONWIDE) return null;
  return RADIUS_OPTIONS.find((option) => String(option) === value) ?? DEFAULT_RADIUS_KM;
}

function parsePage(value: string | undefined): number {
  if (value === undefined || !POSITIVE_INTEGER.test(value)) return 1;
  const page = Number.parseInt(value, 10);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

export function parseSearchQuery(raw: RawSearchParams): SearchQuery {
  const categoria = firstValue(raw.categoria);
  return {
    q: (firstValue(raw.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    categoria: categoria !== undefined && CATEGORY_SLUG.test(categoria) ? categoria : null,
    radio: parseRadius(firstValue(raw.radio)),
    pagina: parsePage(firstValue(raw.pagina)),
  };
}

export function searchHref(query: SearchQuery): string {
  const params = new URLSearchParams();
  if (query.q !== "") params.set("q", query.q);
  if (query.categoria !== null) params.set("categoria", query.categoria);
  if (query.radio === null) params.set("radio", NATIONWIDE);
  else if (query.radio !== DEFAULT_RADIUS_KM) params.set("radio", String(query.radio));
  if (query.pagina !== 1) params.set("pagina", String(query.pagina));
  const search = params.toString();
  return search === "" ? "/buscar" : `/buscar?${search}`;
}
