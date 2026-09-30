import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_RADIUS_KM, RADIUS_OPTIONS, type RadiusKm } from "@/lib/marketplace/params";
import { searchHref, type SearchQuery } from "./query";

type RadiusOption = { label: string; radio: RadiusKm | null; current: boolean };

function optionsFor(query: SearchQuery, geoKind: "coords" | "city", cityName: string | null): RadiusOption[] {
  if (geoKind === "city") {
    return [
      { label: `Sólo ${cityName ?? "tu ciudad"}`, radio: DEFAULT_RADIUS_KM, current: query.radio !== null },
      { label: "Todo el país", radio: null, current: query.radio === null },
    ];
  }
  return [
    ...RADIUS_OPTIONS.map((radio) => ({ label: `${radio} km`, radio, current: query.radio === radio })),
    { label: "Todo el país", radio: null, current: query.radio === null },
  ];
}

export function RadiusFilter({
  query,
  geoKind,
  cityName,
}: {
  query: SearchQuery;
  geoKind: "coords" | "city";
  cityName: string | null;
}) {
  return (
    <nav aria-label="Distancia">
      <ul className="flex flex-wrap gap-2">
        {optionsFor(query, geoKind, cityName).map((option) => (
          <li key={option.label}>
            <Link
              href={searchHref({ ...query, radio: option.radio, pagina: 1 })}
              aria-current={option.current ? "true" : undefined}
              className={buttonVariants({ variant: option.current ? "default" : "outline", size: "sm" })}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
