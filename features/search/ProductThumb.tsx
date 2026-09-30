import Image from "next/image";
import { createElement } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/marketplace/schemas";
import { categoryIcon } from "./categoryIcon";

const thumbSizes = {
  md: { px: 96, box: "size-24", icon: "size-10" },
  lg: { px: 320, box: "size-64 sm:size-80", icon: "size-20" },
} as const;

export function ProductThumb({
  imageUrl,
  category,
  size,
  alt = "",
  preload = false,
}: {
  imageUrl: string | null;
  category: Category | null;
  size: "md" | "lg";
  alt?: string;
  preload?: boolean;
}) {
  const { px, box, icon } = thumbSizes[size];
  if (imageUrl !== null) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={px}
        height={px}
        preload={preload}
        className={cn(box, "shrink-0 rounded-xl object-contain")}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        box,
        "flex shrink-0 items-center justify-center rounded-xl bg-primary-soft text-warning",
      )}
    >
      {createElement(categoryIcon(category), { "aria-hidden": true, className: icon })}
    </div>
  );
}
