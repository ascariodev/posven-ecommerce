import { describe, expect, it } from "vitest";
import { isPageOutOfRange, readPurchasesPage } from "@/features/purchases/lib/pagination";
import { purchase } from "@/features/purchases/__tests__/fixtures/testPurchase";

describe("readPurchasesPage", () => {
  it("lee una página válida", () => {
    expect(readPurchasesPage("3")).toBe(3);
  });

  it.each([
    ["ausente", undefined],
    ["cero", "0"],
    ["no numérica", "dos"],
    ["repetida", ["2", "3"]],
    ["de más de 6 cifras", "1000000"],
  ])("una página %s es la 1", (_name, raw) => {
    expect(readPurchasesPage(raw)).toBe(1);
  });
});

describe("isPageOutOfRange", () => {
  const meta = (page: number, total: number) => ({ page, per_page: 10, total });

  it("una página vacía después de la 1 está fuera de rango", () => {
    expect(isPageOutOfRange({ data: [], meta: meta(3, 11) })).toBe(true);
  });

  it("la 1 vacía es sin compras, no fuera de rango", () => {
    expect(isPageOutOfRange({ data: [], meta: meta(1, 0) })).toBe(false);
  });

  it("una página con compras está en rango", () => {
    expect(isPageOutOfRange({ data: [purchase()], meta: meta(2, 11) })).toBe(false);
  });
});
