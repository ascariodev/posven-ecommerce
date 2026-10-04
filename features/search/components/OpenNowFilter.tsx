import Link from "next/link";
import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { searchHref, type SearchQuery } from "../lib/query";

export function OpenNowFilter({ query }: { query: SearchQuery }) {
  const active = query.openNow === true;
  return (
    <nav aria-label="Disponibilidad">
      <Link
        href={searchHref({ ...query, openNow: active ? undefined : true, pagina: 1 })}
        aria-current={active ? "true" : undefined}
        data-state={active ? "on" : "off"}
        className={cn(toggleVariants({ variant: "outline", size: "sm" }), "rounded-full")}
      >
        Abierto ahora
      </Link>
    </nav>
  );
}
