import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export type BrandIconVariant = "rounded" | "bleed" | "maskable";

const INK = "#28292d";
const PRIMARY = "#ff9d1a";
const ROUNDED_RADIUS_RATIO = 0.22;
const GLYPH_RATIO = { rounded: 0.62, bleed: 0.62, maskable: 0.5 } as const;

export function brandIcon(size: number, variant: BrandIconVariant): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: INK,
          color: PRIMARY,
          fontSize: Math.round(size * GLYPH_RATIO[variant]),
          fontWeight: 700,
          borderRadius: variant === "rounded" ? Math.round(size * ROUNDED_RADIUS_RATIO) : 0,
        }}
      >
        {SITE_NAME.charAt(0).toLowerCase()}
      </div>
    ),
    { width: size, height: size },
  );
}
