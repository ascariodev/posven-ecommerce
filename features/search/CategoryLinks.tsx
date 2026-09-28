import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { searchHref } from "./query";

export function CategoryLinks({ categories }: { categories: CategoryNode[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            href={searchHref({ q: "", categoria: category.slug, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
            className={buttonClasses("secondary", "sm")}
          >
            {category.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
