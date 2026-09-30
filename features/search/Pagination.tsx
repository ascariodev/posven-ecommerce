import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { PageMeta } from "@/lib/marketplace/schemas";
import { searchHref, type SearchQuery } from "./query";

export function Pagination({ query, meta }: { query: SearchQuery; meta: PageMeta }) {
  const lastPage = Math.max(1, Math.ceil(meta.total / meta.per_page));
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-4">
      {meta.page > 1 ? (
        <Link href={searchHref({ ...query, pagina: meta.page - 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Anterior
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-muted-foreground">
        Página {meta.page} de {lastPage}
      </p>
      {meta.page < lastPage ? (
        <Link href={searchHref({ ...query, pagina: meta.page + 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Siguiente
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
