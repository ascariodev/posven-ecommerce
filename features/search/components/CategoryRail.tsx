import Link from "next/link";
import { createElement } from "react";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { categoryIcon } from "../lib/categoryIcon";
import { searchHref } from "../lib/query";

export function CategoryRail({ categories }: { categories: CategoryNode[] }) {
  if (categories.length === 0) return null;
  return (
    <nav
      aria-label="Categorías"
      className="overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-1 p-1">
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0">
            <Link
              href={searchHref({ q: "", categoria: category.slug, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
              className="flex flex-col items-center gap-1.5 border-b-2 border-transparent px-4 pt-1 pb-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:border-foreground hover:text-foreground motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {createElement(categoryIcon(category), { "aria-hidden": true, className: "size-6" })}
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
