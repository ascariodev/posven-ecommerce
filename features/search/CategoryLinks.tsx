import Link from "next/link";
import { createElement } from "react";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { categoryIcon } from "./categoryIcon";
import { searchHref } from "./query";

export function CategoryLinks({ categories }: { categories: CategoryNode[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            href={searchHref({ q: "", categoria: category.slug, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium text-foreground shadow-card transition-colors duration-150 hover:bg-muted motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {createElement(categoryIcon(category), { "aria-hidden": true, className: "size-4" })}
            {category.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
