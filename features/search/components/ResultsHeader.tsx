import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { searchHref, type SearchQuery } from "../lib/query";

type Crumb = { label: string; href: string | null };

export function findCategory(
  nodes: CategoryNode[],
  slug: string,
  parent: CategoryNode | null = null,
): { node: CategoryNode; parent: CategoryNode | null } | null {
  for (const node of nodes) {
    if (node.slug === slug) return { node, parent };
    const inChildren = findCategory(node.children, slug, node);
    if (inChildren !== null) return inChildren;
  }
  return null;
}

function categoryHref(query: SearchQuery, slug: string): string {
  return searchHref({ ...query, q: "", categoria: slug, pagina: 1 });
}

function buildCrumbs(query: SearchQuery, categories: CategoryNode[]): { crumbs: Crumb[]; title: string } {
  const found = query.categoria === null ? null : findCategory(categories, query.categoria);
  const crumbs: Crumb[] = [{ label: "Inicio", href: "/" }];
  if (found?.parent) crumbs.push({ label: found.parent.name, href: categoryHref(query, found.parent.slug) });
  if (found) {
    crumbs.push({ label: found.node.name, href: query.q === "" ? null : categoryHref(query, found.node.slug) });
  }
  if (query.q !== "") crumbs.push({ label: query.q, href: null });
  return { crumbs, title: query.q !== "" ? query.q : (found?.node.name ?? "Resultados") };
}

function totalLabel(total: number, query: SearchQuery, geoKind: "coords" | "city" | null, locationName: string | null) {
  const count = total === 1 ? "1 producto" : `${total} productos`;
  if (geoKind === null) return count;
  if (query.radio === null) return `${count} en todo el país`;
  if (geoKind === "city" && locationName !== null) return `${count} en ${locationName}`;
  return `${count} a menos de ${query.radio} km`;
}

export function ResultsHeader({
  query,
  categories,
  total,
  geoKind,
  locationName,
  showTotal,
}: {
  query: SearchQuery;
  categories: CategoryNode[];
  total: number;
  geoKind: "coords" | "city" | null;
  locationName: string | null;
  showTotal: boolean;
}) {
  const { crumbs, title } = buildCrumbs(query, categories);
  return (
    <header className="flex flex-col gap-2">
      <nav aria-label="Migas de pan">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((crumb, index) => (
            <li key={`${index}:${crumb.label}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
              {crumb.href === null ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="rounded-sm text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <h2 className="font-heading text-2xl font-bold text-foreground">{title}</h2>
      {showTotal && (
        <p className="text-sm text-muted-foreground tabular-nums">{totalLabel(total, query, geoKind, locationName)}</p>
      )}
    </header>
  );
}
