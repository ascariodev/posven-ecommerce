import { Fragment, type ReactNode } from "react";
import { HOME_SECTION_KEYS, type HomeSectionKey, type PlacementsResponse } from "@/lib/marketplace/schemas";
import { getPagePlacements, pieceForSlot } from "../server/placements";
import { AdBanner } from "./AdBanner";
import { HomePromos } from "./PromoPiece";

export type HomeContentKey = Exclude<HomeSectionKey, "promos" | "home_strip" | "home_bottom">;
export type HomeBlocks = Record<HomeContentKey, ReactNode>;

const KNOWN_SECTIONS = new Set<string>(HOME_SECTION_KEYS);

export function homeSectionOrder(placements: PlacementsResponse | null): HomeSectionKey[] {
  const sections = placements?.sections;
  if (sections === undefined) return [...HOME_SECTION_KEYS];
  return [...new Set(sections)].filter((key): key is HomeSectionKey => KNOWN_SECTIONS.has(key));
}

function HomeBanner({ placements, slot }: { placements: PlacementsResponse | null; slot: "home_strip" | "home_bottom" }) {
  const piece = pieceForSlot(placements, slot);
  return <AdBanner piece={piece?.format === "banner" ? piece : null} />;
}

type HomeSectionListProps = {
  placements: PlacementsResponse | null;
  blocks: HomeBlocks;
  promoFallbacks: ReactNode[];
};

export function HomeSectionList({ placements, blocks, promoFallbacks }: HomeSectionListProps) {
  return homeSectionOrder(placements).map((key) => (
    <Fragment key={key}>
      {key === "promos" ? (
        <HomePromos placements={placements} fallbacks={promoFallbacks} />
      ) : key === "home_strip" || key === "home_bottom" ? (
        <HomeBanner placements={placements} slot={key} />
      ) : (
        blocks[key]
      )}
    </Fragment>
  ));
}

export async function HomeSections({ blocks, promoFallbacks }: Omit<HomeSectionListProps, "placements">) {
  const placements = await getPagePlacements("home");
  return <HomeSectionList placements={placements} blocks={blocks} promoFallbacks={promoFallbacks} />;
}
