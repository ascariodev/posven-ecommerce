import Link from "next/link";
import Image from "next/image";
import type { CategoryNode } from "@/lib/marketplace/schemas";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import { categoryPhoto } from "../lib/categoryPhoto";
import { searchHref } from "../lib/query";

export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  const withPhoto = categories.filter((category) => categoryPhoto(category) !== null);
  if (withPhoto.length === 0) return null;
  return (
    <section aria-labelledby="category-tiles-title" className="flex flex-col gap-3">
      <h2 id="category-tiles-title" className="font-heading text-xl font-semibold tracking-tight text-foreground">
        Compra por categoría
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {withPhoto.map((category) => (
          <li key={category.slug}>
            <Link
              href={searchHref({ q: "", categoria: category.slug, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
              className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <Image
                src={categoryPhoto(category) as string}
                alt=""
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
              />
              <span className="relative w-full bg-gradient-to-t from-ink to-transparent px-3 pt-8 pb-3 font-heading text-sm font-semibold text-ink-foreground">
                {category.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
