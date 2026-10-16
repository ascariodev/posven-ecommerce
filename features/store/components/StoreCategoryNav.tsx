import Link from "next/link";
import { cn } from "@/lib/utils";
import type { StoreCategories } from "@/lib/marketplace/schemas";

const LINK_BASE =
  "inline-flex min-h-10 shrink-0 items-center justify-between gap-3 rounded-full border px-3.5 text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground md:rounded-[10px] md:border-transparent md:px-3";

function CategoryLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number | null;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        LINK_BASE,
        active
          ? "border-primary bg-primary font-semibold text-primary-foreground md:bg-primary-soft md:text-foreground"
          : "border-border bg-card font-semibold text-foreground hover:bg-muted md:bg-transparent",
      )}
    >
      {label}
      {count !== null && <span className="text-xs tabular-nums opacity-80">{count}</span>}
    </Link>
  );
}

export function StoreCategoryNav({
  slug,
  categories,
  activeCategory,
}: {
  slug: string;
  categories: StoreCategories;
  activeCategory: string | null;
}) {
  return (
    <nav
      aria-label="Categorías de la tienda"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:rounded-2xl md:border md:border-border md:bg-card md:p-2.5 md:pb-2.5"
    >
      <CategoryLink href={`/tienda/${slug}`} label="Todo" count={categories.total} active={activeCategory === null} />
      {categories.items.map((item) => (
        <CategoryLink
          key={item.slug}
          href={`/tienda/${slug}?categoria=${encodeURIComponent(item.slug)}`}
          label={item.name}
          count={item.count}
          active={activeCategory === item.slug}
        />
      ))}
    </nav>
  );
}
