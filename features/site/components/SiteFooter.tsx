import Link from "next/link";
import { searchHref } from "@/features/search/lib/query";
import { listCategories } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { footerYear } from "../lib/year";

const MAX_FOOTER_CATEGORIES = 8;

const linkClass =
  "inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground sm:min-h-0";

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
      <ul className="flex flex-col text-sm sm:gap-2">{children}</ul>
    </nav>
  );
}

export function FooterCategories({ categories }: { categories: CategoryNode[] }) {
  if (categories.length === 0) return null;
  return (
    <FooterColumn title="Categorías">
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
    </FooterColumn>
  );
}

// En el layout raíz, app/error.tsx no cubre el error (L-02): sin API, la columna se omite.
async function rootCategories(): Promise<CategoryNode[]> {
  try {
    const categories = await listCategories();
    return categories.slice(0, MAX_FOOTER_CATEGORIES);
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) return [];
    throw error;
  }
}

export async function SiteFooter() {
  const [categories, year] = await Promise.all([rootCategories(), footerYear()]);
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-xl font-bold tracking-tight text-foreground">{SITE_NAME}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{SITE_DESCRIPTION}</p>
          </div>
          <FooterCategories categories={categories} />
          <FooterColumn title="Comercios">
            <li>
              <Link href="/comercios" className={linkClass}>
                Para comercios
              </Link>
            </li>
          </FooterColumn>
          <FooterColumn title="Legal">
            <li>
              <Link href="/terminos" className={linkClass}>
                Términos
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className={linkClass}>
                Privacidad
              </Link>
            </li>
          </FooterColumn>
        </div>
        <p className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground">
          © {year} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
