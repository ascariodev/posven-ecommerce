import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { RADIUS_OPTIONS } from "@/lib/marketplace/params";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { SITE_NAME } from "@/lib/site";
import { CategoryLinks } from "./CategoryLinks";
import { searchHref, type SearchQuery } from "../lib/query";

const MAX_RELATED_CATEGORIES = 4;

function findParent(nodes: CategoryNode[], slug: string, parent: CategoryNode | null): CategoryNode | null | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return parent;
    const found = findParent(node.children, slug, node);
    if (found !== undefined) return found;
  }
  return undefined;
}

function relatedCategories(categories: CategoryNode[], categoria: string | null): CategoryNode[] {
  if (categoria === null) return categories.slice(0, MAX_RELATED_CATEGORIES);
  const parent = findParent(categories, categoria, null);
  const pool = parent ? parent.children : categories;
  return pool.filter((node) => node.slug !== categoria).slice(0, MAX_RELATED_CATEGORIES);
}

export function EmptyState({
  query,
  geoKind,
  categories,
  nearby,
}: {
  query: SearchQuery;
  geoKind: "coords" | "city" | null;
  categories: CategoryNode[];
  nearby?: ReactNode;
}) {
  const currentRadius = query.radio;
  const widerRadius =
    geoKind === "coords" && currentRadius !== null
      ? RADIUS_OPTIONS.find((option) => option > currentRadius)
      : undefined;
  const offerNationwide = geoKind !== null && query.radio !== null;
  const offerOpenNowOff = query.openNow === true;
  const related = relatedCategories(categories, query.categoria);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-card">
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        {query.q !== ""
          ? `No encontramos resultados para «${query.q}».`
          : "No encontramos resultados en esta categoría."}
      </h2>
      {query.q !== "" && (
        <p className="text-sm text-muted-foreground">Prueba con menos palabras o revisa cómo está escrito.</p>
      )}
      {(widerRadius !== undefined || offerNationwide || offerOpenNowOff) && (
        <div className="flex flex-wrap gap-2">
          {widerRadius !== undefined && (
            <Link
              href={searchHref({ ...query, radio: widerRadius, pagina: 1 })}
              className={buttonVariants({ size: "sm" })}
            >
              Ampliar a {widerRadius} km
            </Link>
          )}
          {offerOpenNowOff && (
            <Link
              href={searchHref({ ...query, openNow: undefined, pagina: 1 })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Quitar «Abierto ahora»
            </Link>
          )}
          {offerNationwide && (
            <Link href={searchHref({ ...query, radio: null, pagina: 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Buscar en todo el país
            </Link>
          )}
        </div>
      )}
      {nearby}
      {related.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Explora por categoría:</p>
          <CategoryLinks categories={related} />
        </div>
      )}
      <Link href="/comercios" className="text-sm text-foreground underline underline-offset-4">
        ¿Tienes un comercio? Aparece en {SITE_NAME}
      </Link>
    </section>
  );
}
