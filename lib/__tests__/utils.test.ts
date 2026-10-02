import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it.each([
    [["shadow-card", "shadow-raised"], "shadow-raised"],
    [["shadow-raised", "shadow-card"], "shadow-card"],
    [["shadow-md", "shadow-raised"], "shadow-raised"],
    [["shadow-card", "shadow-none"], "shadow-none"],
  ])("fusiona las sombras de token propio con las de serie: %j", (classes, expected) => {
    expect(cn(...classes)).toBe(expected);
  });

  it("sigue fusionando las utilidades de serie", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
