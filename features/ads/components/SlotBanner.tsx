import { getPagePlacements, pieceForSlot } from "@/features/ads/server/placements";
import type { PlacementPage } from "@/lib/marketplace/schemas";
import { AdBanner } from "./AdBanner";

export async function SlotBanner({
  page,
  slot,
  scope,
}: {
  page: PlacementPage;
  slot: string;
  scope?: { category?: string | null; store?: string | null };
}) {
  const piece = pieceForSlot(await getPagePlacements(page, scope), slot);
  return <AdBanner piece={piece?.format === "banner" ? piece : null} />;
}
