"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Pill } from "lucide-react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const validImages = images.filter(Boolean);
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="flex flex-col gap-5">
      {validImages.length === 0 ? (
        <div
          role="img"
          aria-label={`${alt} - Sin imagen`}
          className="relative flex aspect-square w-full items-center justify-center rounded-3xl border border-border bg-tile shadow-card"
        >
          <Pill className="size-16 text-tile-foreground" aria-hidden />
        </div>
      ) : (
        <div className="group relative aspect-square w-full overflow-hidden rounded-3xl bg-tile border border-border shadow-card transition-all duration-300 hover:shadow-raised">
          <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <Image
            src={validImages[selectedIndex]}
            alt={`${alt} - Imagen principal`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-8 transition-transform duration-700 ease-out group-hover:scale-110"
            priority
          />
        </div>
      )}

      {validImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
          {validImages.map((img, index) => (
            <button
              key={img}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                selectedIndex === index 
                  ? "border-2 border-primary ring-4 ring-primary/10 shadow-card" 
                  : "border border-border bg-card opacity-70 hover:opacity-100 hover:border-primary/50"
              )}
            >
              <Image
                src={img}
                alt={`${alt} vista ${index + 1}`}
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
