import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import type { OfferSort } from "@/lib/marketplace/params";

export function SortLinks({ slug, sort }: { slug: string; sort: OfferSort }) {
  const options: { sort: OfferSort; label: string; href: string }[] = [
    { sort: "price", label: "Menor precio", href: `/p/${slug}` },
    { sort: "distance", label: "Más cerca", href: `/p/${slug}?orden=cerca` },
  ];

  return (
    <nav aria-label="Orden de las ofertas">
      <ul className="flex flex-wrap gap-2">
        {options.map((option) => (
          <li key={option.sort}>
            <Link
              href={option.href}
              aria-current={option.sort === sort ? "true" : undefined}
              className={buttonClasses(option.sort === sort ? "primary" : "secondary", "sm")}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
