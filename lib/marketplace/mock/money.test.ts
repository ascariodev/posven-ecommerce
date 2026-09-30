import { describe, expect, it } from "vitest";
import { fromCents, multiply, sum, toCents } from "./money";

describe("money del simulado", () => {
  it.each(["0.00", "0.10", "2.35", "1234.50"])("ida y vuelta de %s en céntimos", (value) => {
    expect(fromCents(toCents(value))).toBe(value);
  });

  it("multiplica sin error de coma flotante", () => {
    expect(multiply("0.10", 3)).toBe("0.30");
    expect(multiply("2.35", 7)).toBe("16.45");
  });

  it("suma sin error de coma flotante", () => {
    expect(sum(["1.15", "2.20"])).toBe("3.35");
    expect(sum(["0.10", "0.20"])).toBe("0.30");
    expect(sum([])).toBe("0.00");
  });

  it("rechaza céntimos negativos o no enteros", () => {
    expect(() => fromCents(-1)).toThrow();
    expect(() => fromCents(1.5)).toThrow();
  });
});
