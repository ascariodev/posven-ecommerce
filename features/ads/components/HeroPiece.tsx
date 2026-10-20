import Image from "next/image";
import type { ReactNode } from "react";
import type { Piece } from "@/lib/marketplace/schemas";
import { getPagePlacements, pieceForSlot } from "../server/placements";
import { SPONSORED_LABEL } from "./AdBanner";
import { AdImpression } from "./AdImpression";
import { AdLink } from "./AdLink";

export function HeroPiece({ piece }: { piece: Piece }) {
  const desktop = piece.image_desktop_url ?? piece.image_mobile_url;
  const mobile = piece.image_mobile_url ?? piece.image_desktop_url;
  if (desktop === null || mobile === null) return null;
  const alt = piece.alt ?? "";
  const label = alt === "" ? (piece.advertiser_name ?? SPONSORED_LABEL) : null;

  return (
    <AdImpression
      token={piece.token}
      className="absolute inset-0 overflow-hidden rounded-3xl md:rounded-4xl"
    >
      <AdLink
        piece={piece}
        className="absolute inset-0 block focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ink-foreground"
      >
        <Image src={mobile} alt={alt} fill sizes="100vw" fetchPriority="high" className="object-cover sm:hidden" />
        <span aria-hidden="true" className="absolute inset-0 bg-ink/70 sm:hidden" />
        <Image
          src={desktop}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 992px, 100vw"
          fetchPriority="high"
          className="hidden object-cover sm:block"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 hidden bg-linear-to-r from-ink/85 via-ink/70 via-45% to-ink/10 sm:block"
        />
        {label !== null && <span className="sr-only">{label}</span>}
        {piece.kind === "ad" && (
          <span className="absolute top-3 right-3 rounded-full bg-card px-2 py-0.5 text-xs font-medium text-foreground">
            {SPONSORED_LABEL}
          </span>
        )}
        {(piece.badge !== null || piece.cta !== null) && (
          <span className="absolute right-4 bottom-4 hidden flex-col items-end gap-2 sm:flex">
            {piece.badge !== null && (
              <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground">{piece.badge}</span>
            )}
            {piece.cta !== null && (
              <span className="rounded-lg bg-card px-4 py-2 text-sm font-semibold text-foreground">{piece.cta}</span>
            )}
          </span>
        )}
      </AdLink>
    </AdImpression>
  );
}

export async function HomeHeroSlot({ fallback }: { fallback: ReactNode }) {
  const piece = pieceForSlot(await getPagePlacements("home"), "home_hero");
  if (piece === null || piece.format !== "hero" || (piece.image_desktop_url ?? piece.image_mobile_url) === null) {
    return fallback;
  }
  return <HeroPiece piece={piece} />;
}
