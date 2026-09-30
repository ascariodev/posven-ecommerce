import Link from "next/link";
import { createElement } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { categoryIcon } from "./categoryIcon";
import { searchHref } from "./query";

export function CategoryLinks({ categories }: { categories: CategoryNode[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            href={searchHref({ q: "", categoria: category.slug, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full shadow-card")}
          >
            {createElement(categoryIcon(category), { "aria-hidden": true, className: "size-4" })}
            {category.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
