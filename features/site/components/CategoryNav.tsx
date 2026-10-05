import Link from "next/link";
import { searchHref } from "@/features/search/lib/query";
import { listCategories } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";

const MAX_NAV_CATEGORIES = 7;

const linkClass =
  "inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold whitespace-nowrap text-foreground hover:bg-muted hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

/** Barra de departamentos bajo la cabecera; sin API, no se pinta (el layout raíz no tiene error.tsx, L-02). */
export async function CategoryNav() {
  let categories;
  try {
    categories = (await listCategories()).slice(0, MAX_NAV_CATEGORIES);
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) return null;
    throw error;
  }
  if (categories.length === 0) return null;
  return (
    <nav aria-label="Departamentos" className="mx-auto w-full max-w-5xl overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex items-center gap-1 py-1">
        <li>
          <Link
            href={searchHref({ q: "", categoria: null, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
            className="inline-flex h-10 items-center rounded-lg bg-ink px-3 text-sm font-semibold whitespace-nowrap text-ink-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Todo
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={searchHref({ q: "", categoria: category.slug, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
              className={linkClass}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
