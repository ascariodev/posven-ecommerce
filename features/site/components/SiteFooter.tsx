import Link from "next/link";
import { searchHref } from "@/features/search/lib/query";
import { listCategories } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { footerYear } from "../lib/year";
import { ThemeSwitch } from "./ThemeSwitch";

const MAX_FOOTER_CATEGORIES = 8;

const onInkSwitchClass =
  "focus-visible:border-ink-foreground focus-visible:outline-ink-foreground data-checked:border-ink-foreground data-checked:bg-ink-foreground data-unchecked:border-ink-foreground data-unchecked:bg-transparent data-checked:[&>span]:bg-ink! data-unchecked:[&>span]:bg-ink-foreground!";

const linkClass =
  "inline-flex min-h-11 items-center rounded-sm opacity-75 hover:opacity-100 hover:underline focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-foreground sm:min-h-0";

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-3 font-heading text-sm font-semibold text-primary">{title}</h2>
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
    <footer className="border-t-4 border-primary bg-ink text-ink-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight">
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-xl bg-card text-lg text-primary-text"
              >
                {SITE_NAME.charAt(0).toLowerCase()}
              </span>
              {SITE_NAME}
            </p>
            <p className="mt-3 max-w-xs text-sm opacity-75">{SITE_DESCRIPTION}</p>
            <p className="mt-4 flex w-fit items-center gap-2 rounded-full border border-primary/60 px-3 py-1 text-xs font-semibold text-primary">
              Retira hoy · Precios en $ y Bs
            </p>
          </div>
          <FooterCategories categories={categories} />
          <FooterColumn title="Ayuda">
            <li>
              <Link href="/ayuda" className={linkClass}>
                Centro de ayuda
              </Link>
            </li>
          </FooterColumn>
          <FooterColumn title="Comercios">
            <li>
              <Link href="/vende" className={linkClass}>
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
        <div className="mt-10 flex flex-col gap-2 border-t border-ink-foreground/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm opacity-75">
            © {year} {SITE_NAME}
          </p>
          <ThemeSwitch className="sm:w-52" switchClassName={onInkSwitchClass} />
        </div>
      </div>
    </footer>
  );
}
