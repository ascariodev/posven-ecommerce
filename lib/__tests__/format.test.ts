import { describe, expect, it } from "vitest";
import { formatDistance, formatRate, formatUpdatedAgo, formatUsd, formatVes } from "@/lib/format";

describe("formatUsd", () => {
  it.each([
    ["1234.50", "$ 1.234,50"],
    ["0.99", "$ 0,99"],
    ["0.00", "$ 0,00"],
    ["1000000.00", "$ 1.000.000,00"],
  ])("%s -> %s", (amount, expected) => {
    expect(formatUsd(amount)).toBe(expected);
  });

  it("devuelve tal cual una cadena que no casa el formato", () => {
    expect(formatUsd("12.5")).toBe("12.5");
  });
});

describe("formatVes", () => {
  it.each([
    ["45062.50", "Bs 45.062,50"],
    ["0.00", "Bs 0,00"],
    ["1000000.00", "Bs 1.000.000,00"],
  ])("%s -> %s", (amount, expected) => {
    expect(formatVes(amount)).toBe(expected);
  });

  it("devuelve tal cual una cadena que no casa el formato", () => {
    expect(formatVes("abc")).toBe("abc");
  });
});

describe("formatRate", () => {
  it("muestra fecha dd/mm/aaaa y la tasa con coma", () => {
    expect(formatRate({ usd_ves: "36.50", valid_on: "2026-09-26" })).toBe(
      "Tasa BCV del 26/09/2026: Bs 36,50",
    );
  });

  it("conserva los decimales que trae la tasa", () => {
    expect(formatRate({ usd_ves: "36.5421", valid_on: "2026-09-26" })).toBe(
      "Tasa BCV del 26/09/2026: Bs 36,5421",
    );
  });

  it("deja tal cual las partes que no casan el formato", () => {
    expect(formatRate({ usd_ves: "36", valid_on: "26-09-2026" })).toBe(
      "Tasa BCV del 26-09-2026: Bs 36",
    );
  });
});

describe("formatDistance", () => {
  it.each([
    [0.85, "a 850 m"],
    [0.02, "a 50 m"],
    [1.2, "a 1,2 km"],
    [12, "a 12 km"],
  ])("%s km -> %s", (km, expected) => {
    expect(formatDistance(km)).toBe(expected);
  });
});

describe("formatUpdatedAgo", () => {
  const now = new Date("2026-09-28T12:00:00Z");

  it.each([
    ["2026-09-28T11:59:30Z", "Actualizado hace un momento"],
    ["2026-09-28T11:15:10Z", "Actualizado hace 44 min"],
    ["2026-09-28T06:30:00Z", "Actualizado hace 5 h"],
    ["2026-09-25T10:00:00Z", "Actualizado hace 3 días"],
  ])("%s -> %s", (iso, expected) => {
    expect(formatUpdatedAgo(iso, now)).toBe(expected);
  });

  it("usa el singular con un día", () => {
    expect(formatUpdatedAgo("2026-09-27T08:00:00Z", now)).toBe("Actualizado hace 1 día");
  });
});
