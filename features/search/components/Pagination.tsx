import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { PageMeta } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";

type PageItem = number | "gap-start" | "gap-end";

function pageItems(current: number, last: number): PageItem[] {
  const wanted = new Set([1, last, current - 1, current, current + 1]);
  const pages = [...wanted].filter((page) => page >= 1 && page <= last).sort((a, b) => a - b);
  const items: PageItem[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous > 1) items.push(previous < current ? "gap-start" : "gap-end");
    items.push(page);
  });
  return items;
}

const pageNumber = "min-w-11 px-3 tabular-nums";

export function Pagination({ meta, hrefForPage }: { meta: PageMeta; hrefForPage: (page: number) => string }) {
  const lastPage = Math.max(1, Math.ceil(meta.total / meta.per_page));
  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-2">
      {meta.page > 1 && (
        <Link href={hrefForPage(meta.page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Anterior
        </Link>
      )}
      <ol className="flex items-center gap-1">
        {pageItems(meta.page, lastPage).map((item) =>
          typeof item === "string" ? (
            <li key={item} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              {item === meta.page ? (
                <span
                  aria-current="page"
                  aria-label={`Página ${item} de ${lastPage}`}
                  className={cn(buttonVariants({ variant: "default", size: "sm" }), pageNumber, "pointer-events-none")}
                >
                  {item}
                </span>
              ) : (
                <Link
                  href={hrefForPage(item)}
                  aria-label={`Ir a la página ${item}`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), pageNumber)}
                >
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>
      {meta.page < lastPage && (
        <Link href={hrefForPage(meta.page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Siguiente
        </Link>
      )}
    </nav>
  );
}
