import { X } from "lucide-react";
import Link from "next/link";
import { toggleVariants } from "@/components/ui/toggle";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { searchHref, type SearchQuery } from "../lib/query";
import { findCategory } from "./ResultsHeader";

type Chip = { label: string; href: string };

function chipsFor(query: SearchQuery, categories: CategoryNode[], hasLocation: boolean): Chip[] {
  const chips: Chip[] = [];
  const category = query.q !== "" && query.categoria !== null ? findCategory(categories, query.categoria) : null;
  if (category) chips.push({ label: category.node.name, href: searchHref({ ...query, categoria: null, pagina: 1 }) });
  if (hasLocation && query.radio !== DEFAULT_RADIUS_KM) {
    chips.push({
      label: query.radio === null ? "Todo el país" : `${query.radio} km`,
      href: searchHref({ ...query, radio: DEFAULT_RADIUS_KM, pagina: 1 }),
    });
  }
  if (query.openNow === true) {
    chips.push({ label: "Abierto ahora", href: searchHref({ ...query, openNow: undefined, pagina: 1 }) });
  }
  return chips;
}

export function ActiveFilters({
  query,
  categories,
  hasLocation,
}: {
  query: SearchQuery;
  categories: CategoryNode[];
  hasLocation: boolean;
}) {
  const chips = chipsFor(query, categories, hasLocation);
  if (chips.length === 0) return null;
  const clearHref = searchHref({ ...query, categoria: query.q === "" ? query.categoria : null, radio: DEFAULT_RADIUS_KM, openNow: undefined, pagina: 1 });
  return (
    <nav aria-label="Filtros activos">
      <ul className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <li key={chip.href}>
            <Link
              href={chip.href}
              aria-label={`Quitar filtro ${chip.label}`}
              className={cn(toggleVariants({ variant: "outline", size: "sm" }), "rounded-full bg-primary-soft")}
            >
              {chip.label}
              <X aria-hidden="true" />
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={clearHref}
            className="inline-flex h-11 items-center rounded-full px-3 text-sm font-medium text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground md:h-9"
          >
            Limpiar filtros
          </Link>
        </li>
      </ul>
    </nav>
  );
}
