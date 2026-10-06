import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export type BrandIconVariant = "rounded" | "bleed" | "maskable";

const INK = "#28292d";
const PRIMARY = "#ff9d1a";
const ROUNDED_RADIUS_RATIO = 0.22;
const GLYPH_RATIO = { rounded: 0.62, bleed: 0.62, maskable: 0.5 } as const;

const FONT_PATH = path.join(process.cwd(), "features", "site", "assets", "Poppins-Bold.ttf");

async function loadHeadingFont(): Promise<ArrayBuffer> {
  const file = await readFile(FONT_PATH);
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
}

export async function brandIcon(size: number, variant: BrandIconVariant): Promise<ImageResponse> {
  const fontData = await loadHeadingFont();
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
          fontFamily: "Poppins",
          fontSize: Math.round(size * GLYPH_RATIO[variant]),
          fontWeight: 700,
          borderRadius: variant === "rounded" ? Math.round(size * ROUNDED_RADIUS_RATIO) : 0,
        }}
      >
        {SITE_NAME.charAt(0).toLowerCase()}
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: "Poppins", data: fontData, weight: 700, style: "normal" }],
    },
  );
}
