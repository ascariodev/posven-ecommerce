import Image from "next/image";
import type { ReactNode } from "react";
import type { Piece, PlacementsResponse } from "@/lib/marketplace/schemas";
import { pieceForSlot } from "../server/placements";
import { SPONSORED_LABEL } from "./AdBanner";
import { AdImpression } from "./AdImpression";
import { AdLink } from "./AdLink";

export function PromoPiece({ piece }: { piece: Piece }) {
  const image = piece.image_desktop_url ?? piece.image_mobile_url;
  if (image === null) return null;
  const alt = piece.alt ?? "";
  const label = alt === "" && piece.title === null ? (piece.advertiser_name ?? SPONSORED_LABEL) : null;

  return (
    <AdImpression token={piece.token} className="flex w-full">
      <AdLink
        piece={piece}
        className="relative flex min-h-44 w-full flex-col justify-center gap-2 overflow-hidden rounded-3xl bg-ink p-6 text-ink-foreground transition-shadow hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
      >
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className="object-cover object-right [mask-image:linear-gradient(to_right,transparent_20%,black_65%)]"
        />
        {label !== null && <span className="sr-only">{label}</span>}
        {piece.kind === "ad" && (
          <span className="absolute top-3 right-3 rounded-full bg-card px-2 py-0.5 text-xs font-medium text-foreground">
            {SPONSORED_LABEL}
          </span>
        )}
        {piece.badge !== null && <span className="relative text-xs font-semibold text-primary">{piece.badge}</span>}
        {piece.title !== null && (
          <span className="relative line-clamp-2 max-w-[55%] font-heading text-xl leading-tight font-semibold">
            {piece.title}
          </span>
        )}
        {piece.cta !== null && (
          <span className="relative w-fit rounded-lg bg-card px-4 py-2 text-sm font-semibold text-foreground">{piece.cta}</span>
        )}
      </AdLink>
    </AdImpression>
  );
}

export const HOME_PROMO_SLOTS = ["home_promo_1", "home_promo_2"] as const;

export function PromoList({ items }: { items: ReactNode[] }) {
  const present = items.flatMap((item, index) => (item === null || item === undefined ? [] : [{ item, index }]));
  if (present.length === 0) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      {present.map(({ item, index }) => (
        <li key={index} className="flex">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function HomePromos({ placements, fallbacks }: { placements: PlacementsResponse | null; fallbacks: ReactNode[] }) {
  const items = HOME_PROMO_SLOTS.map((slot, index) => {
    const piece = pieceForSlot(placements, slot);
    if (piece === null || piece.format !== "promo" || (piece.image_desktop_url ?? piece.image_mobile_url) === null) {
      return fallbacks[index] ?? null;
    }
    return <PromoPiece key={slot} piece={piece} />;
  });
  return <PromoList items={items} />;
}
