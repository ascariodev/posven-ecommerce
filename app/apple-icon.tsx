import { brandIcon } from "@/features/site/lib/brand-icon";
import { SITE_NAME } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return brandIcon(size.width, "bleed");
}
