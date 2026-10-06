import { notFound } from "next/navigation";
import { brandIcon, type BrandIconVariant } from "@/features/site/lib/brand-icon";
import { SITE_NAME } from "@/lib/site";

const ICONS: Record<string, { size: number; variant: BrandIconVariant }> = {
  "32": { size: 32, variant: "rounded" },
  "192": { size: 192, variant: "rounded" },
  "512": { size: 512, variant: "rounded" },
  maskable: { size: 512, variant: "maskable" },
};

export function generateImageMetadata() {
  return Object.entries(ICONS).map(([id, { size }]) => ({
    id,
    alt: SITE_NAME,
    contentType: "image/png",
    size: { width: size, height: size },
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const icon = ICONS[String(await id)];
  if (!icon) notFound();
  const { size, variant } = icon;
  return brandIcon(size, variant);
}
