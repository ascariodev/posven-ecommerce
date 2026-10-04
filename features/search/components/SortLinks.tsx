import Link from "next/link";
import { toggleVariants } from "@/components/ui/toggle";
import type { OfferSort } from "@/lib/marketplace/params";
import { cn } from "@/lib/utils";
import { searchHref, type SearchQuery } from "../lib/query";

type SortOption = { label: string; value: OfferSort | undefined; current: boolean };

function optionsFor(query: SearchQuery, hasLocation: boolean): SortOption[] {
  if (hasLocation) {
    const effective = query.sort ?? "distance";
    return [
      { label: "Más cercano", value: undefined, current: effective === "distance" },
      { label: "Menor precio", value: "price", current: effective === "price" },
    ];
  }
  const byPrice = query.sort === "price";
  return [
    { label: "Relevancia", value: undefined, current: !byPrice },
    { label: "Menor precio", value: "price", current: byPrice },
  ];
}

export function SortLinks({ query, hasLocation }: { query: SearchQuery; hasLocation: boolean }) {
  return (
    <nav aria-label="Ordenar por">
      <ul className="flex flex-wrap gap-2">
        {optionsFor(query, hasLocation).map((option) => (
          <li key={option.label}>
            <Link
              href={searchHref({ ...query, sort: option.value, pagina: 1 })}
              aria-current={option.current ? "true" : undefined}
              data-state={option.current ? "on" : "off"}
              className={cn(toggleVariants({ variant: "outline", size: "sm" }), "rounded-full")}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
