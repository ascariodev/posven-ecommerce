import Link from "next/link";
import { createElement } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { categoryIcon } from "../lib/categoryIcon";
import { searchHref } from "../lib/query";

const chipShape =
  "h-11 rounded-full px-4 text-sm font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const chipClass = cn(buttonVariants({ variant: "outline" }), "border-input-border", chipShape);
const allChipClass = cn(buttonVariants({ variant: "default" }), chipShape);

export function CategoryRail({ categories }: { categories: CategoryNode[] }) {
  if (categories.length === 0) return null;
  return (
    <nav aria-label="Categorías" className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-2.5 p-1">
        <li className="shrink-0">
          <Link
            href={searchHref({ q: "", categoria: null, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
            className={allChipClass}
          >
            Todo
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0">
            <Link
              href={searchHref({ q: "", categoria: category.slug, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
              className={chipClass}
            >
              {createElement(categoryIcon(category), { "aria-hidden": true, className: "size-4" })}
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
