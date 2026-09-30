import Image from "next/image";
import { createElement } from "react";
import { categoryIcon } from "@/features/search/categoryIcon";
import type { Category } from "@/lib/marketplace/schemas";

const tints = [
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-emerald-100 text-emerald-800",
  "bg-rose-100 text-rose-800",
];

function tintFor(category: Category | null): string {
  const slug = category?.slug ?? "";
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) % tints.length;
  return tints[hash];
}

export function PreviewThumb({
  imageUrl,
  category,
  alt = "",
  className = "aspect-[4/3]",
  iconClassName = "size-12",
}: {
  imageUrl: string | null;
  category: Category | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
}) {
  if (imageUrl !== null) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-muted ${className}`}>
        <Image src={imageUrl} alt={alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-contain p-3" />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-2xl ${tintFor(category)} ${className}`}
    >
      {createElement(categoryIcon(category), { "aria-hidden": true, className: iconClassName })}
    </div>
  );
}
