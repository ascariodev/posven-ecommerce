import Image from "next/image";
import { createElement } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/marketplace/schemas";
import { categoryIcon } from "./categoryIcon";
import { categoryTint } from "./categoryTint";

const thumbSizes = {
  md: { px: 96, box: "size-24", icon: "size-10" },
  lg: { px: 320, box: "size-64 sm:size-80", icon: "size-20" },
} as const;

const CARD_BOX = "relative aspect-[4/3] w-full overflow-hidden rounded-lg";

export function ProductThumb({
  imageUrl,
  category,
  size,
  alt = "",
  preload = false,
  className,
}: {
  imageUrl: string | null;
  category: Category | null;
  size: "md" | "lg" | "card";
  alt?: string;
  preload?: boolean;
  className?: string;
}) {
  if (size === "card") {
    if (imageUrl !== null) {
      return (
        <div className={cn(CARD_BOX, "bg-muted", className)}>
          <Image
            src={imageUrl}
            alt={alt}
            fill
            preload={preload}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-contain p-3"
          />
        </div>
      );
    }
    const tint = categoryTint(category);
    return (
      <div
        aria-hidden="true"
        className={cn(CARD_BOX, "flex items-center justify-center", tint.bg, tint.fg, className)}
      >
        {createElement(categoryIcon(category), { "aria-hidden": true, className: "size-12" })}
      </div>
    );
  }
  const { px, box, icon } = thumbSizes[size];
  if (imageUrl !== null) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={px}
        height={px}
        preload={preload}
        className={cn(box, "shrink-0 rounded-md object-contain", className)}
      />
    );
  }
  const tint = categoryTint(category);
  return (
    <div
      aria-hidden="true"
      className={cn(box, "flex shrink-0 items-center justify-center rounded-md", tint.bg, tint.fg, className)}
    >
      {createElement(categoryIcon(category), { "aria-hidden": true, className: icon })}
    </div>
  );
}
