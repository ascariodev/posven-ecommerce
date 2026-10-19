import Image from "next/image";
import type { Piece } from "@/lib/marketplace/schemas";
import { AdImpression } from "./AdImpression";
import { AdLink } from "./AdLink";

export const SPONSORED_LABEL = "Patrocinado";

export function AdBanner({ piece, className }: { piece: Piece | null; className?: string }) {
  if (piece === null) return null;
  const desktop = piece.image_desktop_url ?? piece.image_mobile_url;
  const mobile = piece.image_mobile_url ?? piece.image_desktop_url;
  if (desktop === null || mobile === null) return null;
  const alt = piece.alt ?? "";

  return (
    <AdImpression token={piece.token} className={className}>
      <AdLink
        piece={piece}
        className="group relative block aspect-[2/1] w-full overflow-hidden rounded-2xl bg-muted shadow-card transition-shadow hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none sm:aspect-[5/1]"
      >
        <Image src={mobile} alt={alt} fill sizes="100vw" className="object-cover sm:hidden" />
        <Image src={desktop} alt={alt} fill sizes="(min-width: 1280px) 1200px, 100vw" className="hidden object-cover sm:block" />
        {piece.kind === "ad" && (
          <span className="absolute top-2 left-2 rounded-full bg-card px-2 py-0.5 text-xs font-medium text-foreground">
            {SPONSORED_LABEL}
          </span>
        )}
      </AdLink>
    </AdImpression>
  );
}
