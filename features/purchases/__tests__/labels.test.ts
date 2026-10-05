import { describe, expect, it } from "vitest";
import { chargeText } from "@/features/purchases/lib/labels";
import { formatUsd, formatVes } from "@/lib/format";

describe("chargeText", () => {
  it("formatea en bolívares lo cobrado en VES", () => {
    expect(chargeText({ currency: "VES", amount: "1234.50" })).toBe(formatVes("1234.50"));
  });

  it("formatea en dólares lo cobrado en USD", () => {
    expect(chargeText({ currency: "USD", amount: "12.00" })).toBe(formatUsd("12.00"));
  });
});
