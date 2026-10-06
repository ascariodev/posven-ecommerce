// @vitest-environment node
import { describe, expect, it } from "vitest";
import { brandIcon } from "@/features/site/lib/brand-icon";

describe("brandIcon", () => {
  it("encuentra la fuente y rinde un PNG", async () => {
    const response = await brandIcon(64, "rounded");
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(Array.from(bytes.slice(1, 4))).toEqual([0x50, 0x4e, 0x47]);
    expect(bytes.length).toBeGreaterThan(100);
  });
});
